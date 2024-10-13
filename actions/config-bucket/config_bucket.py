import argparse
import subprocess
import json
import write_outputs as wo


def call(bucket_name, aws_region, has_versioning):
    if bucket_exists(bucket_name, aws_region):
        wo.info("Bucket already exists... skipping!")
    else:
        account_id = (
            subprocess.run(
                f'aws sts get-caller-identity --query "Account" --region {aws_region}',
                shell=True,
                stdout=subprocess.PIPE,
                text=True,
            )
            .stdout.replace('"', "")
            .replace("\r\n", "")
            .strip()
        )
        logs_bucket_name = f"infotain-s3-logs-bucket-{account_id}-{aws_region}"
        trail_name = f"infotain-s3-trail-{account_id}-{aws_region}"

        if aws_region != "cn-north-1":
            if bucket_exists(logs_bucket_name, aws_region):
                wo.info("Logs bucket already exists... skipping!")
            else:
                create_bucket(logs_bucket_name, aws_region)

                # If the logs bucket configuration fails the pipeline aborts the creation of the main bucket.
                try:
                    config_logs_bucket(logs_bucket_name, aws_region, account_id)

                except Exception as e:
                    wo.error(f"Bucket {bucket_name} creation aborted!")
                    delete_bucket(logs_bucket_name, aws_region)
                    raise

            if trail_exists(trail_name, aws_region):
                wo.info("Trail already exists... skipping!")
            else:
                create_trail(trail_name, logs_bucket_name, aws_region)

        create_bucket(bucket_name, aws_region)

        try:
            config_main_bucket(
                bucket_name, logs_bucket_name, trail_name, aws_region, account_id
            )
        except Exception:
            delete_bucket(bucket_name, aws_region)
            raise

    if has_versioning:
        wo.info(f"Enabling versioning on {bucket_name}")
        cmd = f"""\
            aws s3api put-bucket-versioning \
            --bucket {bucket_name} \
            --region {aws_region} \
            --versioning-configuration Status=Enabled \
        """


def bucket_exists(bucket_name, aws_region):
    cmd = f"aws s3api head-bucket --bucket {bucket_name} --region {aws_region}"
    try:
        subprocess.run(cmd, check=True, shell=True)
        return True
    except subprocess.CalledProcessError as e:
        wo.error(f"Checking if bucket exists: {e}")
        return False


def create_bucket(bucket_name, aws_region):
    cmd = f"aws s3api create-bucket --bucket {bucket_name} --region {aws_region}"

    # Needed to avoid 'us-east-1' reported bug: https://github.com/boto/boto3/issues/125
    if aws_region != "us-east-1":
        cmd += f" --create-bucket-configuration LocationConstraint={aws_region}"
    wo.info(f"Creating bucket {bucket_name}")
    subprocess.run(cmd, shell=True)
    wo.info(f"Bucket {bucket_name} creation success!")


def delete_bucket(bucket_name, aws_region):
    wo.error(f"Bucket {bucket_name} configuration failed!")
    wo.info(f"Deleting bucket {bucket_name}!")
    cmd = f"aws s3api delete-bucket --bucket {bucket_name} --region {aws_region}"
    subprocess.run(cmd, shell=True)
    wo.info(f"Bucket {bucket_name} deleted!")


# Configures the logs bucket
# This bucket receives the logs of Server Access to other buckets.
# Security findings of this bucket may be suppressed.
def config_logs_bucket(bucket_name, aws_region, account_id):
    # Blocks public access to the bucket. S3.3
    wo.info("Configuring logs bucket public access block")
    cmd = f"""\
        aws s3api put-public-access-block --bucket {bucket_name} --region {aws_region} \
        --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
    """
    subprocess.run(cmd, shell=True, check=True)

    # Adds server-side 256-bit Advanced Encryption Standard (AES-256). S3.4
    wo.info("Configuring bucket encryption")
    server_side_encryption_by_default = {
        "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
    }

    cmd = " ".join([
        "aws",
        "s3api",
        "put-bucket-encryption",
        "--bucket",
        bucket_name,
        "--server-side-encryption-configuration",
        json.dumps(json.dumps(server_side_encryption_by_default)),
    ])

    subprocess.run(cmd, shell=True, check=True)

    # Grant the logging service principal permission. Used for server access logs.
    wo.info("Configuring logs bucket policies")
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:*",
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*",
                ],
                "Condition": {"Bool": {"aws:SecureTransport": "false"}},
            },
            {
                "Effect": "Allow",
                "Principal": {"Service": "logging.s3.amazonaws.com"},
                "Action": "s3:PutObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*",
                "Condition": {
                    "StringEquals": {"aws:SourceAccount": account_id},
                    "ArnLike": {"aws:SourceARN": "arn:aws:s3:::*"},
                },
            },
            {
                "Sid": "AWSCloudTrailAclCheck20150319",
                "Effect": "Allow",
                "Principal": {"Service": "cloudtrail.amazonaws.com"},
                "Action": "s3:GetBucketAcl",
                "Resource": f"arn:aws:s3:::{bucket_name}",
                "Condition": {"StringEquals": {"aws:SourceAccount": account_id}},
            },
            {
                "Sid": "AWSCloudTrailWrite20150319",
                "Effect": "Allow",
                "Principal": {"Service": "cloudtrail.amazonaws.com"},
                "Action": "s3:PutObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/CloudTrailLogs/*",
                "Condition": {"StringEquals": {"aws:SourceAccount": account_id}},
            },
        ],
    }

    cmd = " ".join([
        "aws",
        "s3api",
        "put-bucket-policy",
        "--bucket",
        bucket_name,
        "--policy",
        json.dumps(json.dumps(bucket_policy)),
    ])

    subprocess.run(cmd, shell=True, check=True)

    # Defines lifecycle configuration for objects in the bucket. Logs are kept for 10 days.
    lifecycle_configuration = {
        "Rules": [{"Status": "Enabled", "Prefix": "", "Expiration": {"Days": 10}}]
    }
    cmd = " ".join([
        "aws",
        "s3api",
        "put-bucket-lifecycle-configuration",
        "--bucket",
        bucket_name,
        "--lifecycle-configuration",
        json.dumps(json.dumps(lifecycle_configuration)),
    ])
    subprocess.run(cmd, shell=True, check=True)
    wo.info(f"Bucket {bucket_name} configuration success!")


# Configures the main bucket
# Most configurations are used to follow AWS Foundational Security Best Practices.
# https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-standards-fsbp-controls.html
def config_main_bucket(
    bucket_name, logs_bucket_name, trail_name, aws_region, account_id
):
    # The Events lambda must exist for the bucket configuration. Repo: https://atc.bmwgroup.net/bitbucket/projects/ISEIAC/repos/infotain-s3-notification-lambda"
    bucket_event_notification_lambda_name = "infotain-s3-event-notification-lambda"

    # Blocks public access to the bucket. S3.3
    wo.info(f"Configuring bucket public access block")
    cmd = f"""\
        aws s3api put-public-access-block \
        --bucket {bucket_name} \
        --region {aws_region} \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
    """

    if aws_region != "cn-north-1":
        # Adds server-side 256-bit Advanced Encryption Standard (AES-256). S3.4
        wo.info("Configuring bucket encryption")
        server_side_encryption_by_default = {
            "Rules": [
                {"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
            ]
        }

        cmd = " ".join([
            "aws",
            "s3api",
            "put-bucket-encryption",
            "--bucket",
            bucket_name,
            "--server-side-encryption-configuration",
            json.dumps(json.dumps(server_side_encryption_by_default)),
        ])

        subprocess.run(cmd, shell=True, check=True)

        # Denies any action on the bucket if SSL is not being used. S3.5
        wo.info("Configuring bucket policies")
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}",
                        f"arn:aws:s3:::{bucket_name}/*",
                    ],
                    "Condition": {"Bool": {"aws:SecureTransport": "false"}},
                }
            ],
        }

        cmd = " ".join([
            "aws",
            "s3api",
            "put-bucket-policy",
            "--bucket",
            bucket_name,
            "--policy",
            json.dumps(json.dumps(bucket_policy)),
        ])

        subprocess.run(cmd, shell=True, check=True)

        # Defines the target bucket to receive Server Access logs. S3.9
        wo.info("Configuring bucket logging")
        bucket_logging_status = {
            "LoggingEnabled": {
                "TargetBucket": f"{logs_bucket_name}",
                "TargetPrefix": f"{bucket_name}/Logs/",
            }
        }
        cmd = " ".join([
            "aws",
            "s3api",
            "put-bucket-logging",
            "--bucket",
            bucket_name,
            "--bucket-logging-status",
            json.dumps(json.dumps(bucket_logging_status)),
        ])

        subprocess.run(cmd, check=True, shell=True)

        # Defines lifecycle configuration for objects in the bucket.
        # Objects must have a tag "toTransition" with value "true" for 36500 days for a transition to occur.
        # Essentially does not change the storage class of objects but complies with S3.10 S3.13
        wo.info("Configuring bucket lifecycle")
        lifecycle_configuration = {
            "Rules": [
                {
                    "Status": "Enabled",
                    "Filter": {"Tag": {"Key": "toTransition", "Value": "true"}},
                    "Transitions": [
                        {"Days": 36500, "StorageClass": "INTELLIGENT_TIERING"}
                    ],
                },
                {
                    "Status": "Enabled",
                    "Filter": {"Tag": {"Key": "toTransition", "Value": "true"}},
                    "NoncurrentVersionTransitions": [
                        {"NoncurrentDays": 36500, "StorageClass": "INTELLIGENT_TIERING"}
                    ],
                },
            ]
        }

        cmd = " ".join([
            "aws",
            "s3api",
            "put-bucket-lifecycle-configuration",
            "--bucket",
            bucket_name,
            "--lifecycle-configuration",
            json.dumps(json.dumps(lifecycle_configuration)),
        ])

        subprocess.run(cmd, check=True, shell=True)

        # Setup for bucket Event Notifications. S3.11
        try:
            # Defines the Events that are sent to the lambda function. S3.11
            wo.info("Configuring bucket event notifications")
            notification_configuration = {
                "LambdaFunctionConfigurations": [
                    {
                        "LambdaFunctionArn": f"arn:aws:lambda:{aws_region}:{account_id}:function:{bucket_event_notification_lambda_name}",
                        "Events": ["s3:ObjectCreated:*"],
                    },
                    {
                        "LambdaFunctionArn": f"arn:aws:lambda:{aws_region}:{account_id}:function:{bucket_event_notification_lambda_name}",
                        "Events": ["s3:ObjectRemoved:*"],
                    },
                ]
            }

            cmd = " ".join([
                "aws",
                "s3api",
                "put-bucket-notification-configuration",
                "--bucket",
                bucket_name,
                "--notification-configuration",
                json.dumps(json.dumps(notification_configuration)),
            ])

            subprocess.run(cmd, shell=True, check=True)

        except Exception:
            wo.error(f"Bucket {bucket_name} notification configuration failed!")
            wo.info(
                "The target notification Lambda must be configured. Repo: https://atc.bmwgroup.net/bitbucket/projects/ISEIAC/repos/infotain-s3-notification-lambda"
            )
            raise

        add_bucket_to_trail(trail_name, bucket_name, aws_region)

    wo.success(f"Bucket {bucket_name} configuration success!")


def trail_exists(trail_name, aws_region):
    return get_trail(trail_name, aws_region) != None


def get_trail(trail_name, aws_region):
    trail_arn = None
    try:
        cmd = f"aws cloudtrail list-trails --region {aws_region}"
        trails = subprocess.run(
            cmd, text=True, shell=True, stdout=subprocess.PIPE
        ).stdout
        for trail in json.loads(trails)["Trails"]:
            if trail["Name"] == trail_name:
                trail_arn = trail["TrailARN"]
                break
    except Exception:
        wo.info(f"Trail {trail_name} not found!")

    return trail_arn


def create_trail(trail_name, logs_bucket_name, aws_region):
    wo.info(f"Creating trail {trail_name}")

    cmd = f"""\
        aws cloudtrail create-trail \
            --name {trail_name} \
            --s3-bucket-name {logs_bucket_name} \
            --s3-key-prefix CloudTrailLogs --region {aws_region} \
            --no-include-global-service-events \
    """
    subprocess.run(cmd, shell=True, check=True)

    wo.info("Configuring trail to log events")

    cmd = f"aws cloudtrail start-logging  --name {trail_name} --region {aws_region}"

    subprocess.run(cmd, shell=True, check=True)

    wo.info(f"Trail {trail_name} creation success!")


def add_bucket_to_trail(trail_name, bucket_name, aws_region):
    wo.info("Adding bucket to trail")

    trail_arn = get_trail(trail_name, aws_region)
    bucket_arn = f"arn:aws:s3:::{bucket_name}/"

    cmd = f"aws cloudtrail get-event-selectors --trail-name {trail_arn} --region {aws_region}"
    result = subprocess.run(
        cmd, shell=True, check=True, text=True, stdout=subprocess.PIPE
    )

    try:
        buckets = []
        event_selectors = json.loads(result.stdout)["EventSelectors"]
        for event_selector in event_selectors:
            for data_resoures in event_selector["DataResources"]:
                if data_resoures["Type"] == "AWS::S3::Object":
                    buckets = data_resoures["Values"]
                    break
    except Exception:
        pass

    buckets.append(bucket_arn)

    event_selectors = [
        {
            "ReadWriteType": "All",
            "IncludeManagementEvents": False,
            "DataResources": [{"Type": "AWS::S3::Object", "Values": buckets}],
        }
    ]

    cmd = " ".join([
        "aws",
        "cloudtrail",
        "put-event-selectors",
        "--event-selectors",
        json.dumps(json.dumps(event_selectors)),
        "--region",
        aws_region,
        "--trail-name",
        trail_arn,
    ])

    subprocess.run(cmd, shell=True, check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bucket", help="The s3 bucket name", required=True)
    parser.add_argument("--aws-region", help="The AWS region", required=True)
    parser.add_argument(
        "--has-versioning",
        action="store_true",
        help="Flag stating if bucket versioning should be enabled (disabled by default)",
        required=False,
    )

    args = parser.parse_args()

    call(args.bucket, args.aws_region, args.has_versioning)

def escape_json(json):
    return f'{json}'

if __name__ == "__main__":
    main()

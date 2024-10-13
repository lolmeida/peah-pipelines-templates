from textwrap import dedent

import boto3
import os
import logging

memorydb = boto3.client('memorydb')
s3 = boto3.client('s3')

# set logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

team = os.environ['TEAM']
environment = os.environ['ENVIRONMENT']
region = os.environ['REGION']
accountId = os.environ['ACCOUNT_ID']
arn_region = os.environ['ARN_REGION']
clusterIdentity = os.environ['CLUSTER_IDENTITY']
bucketId = os.environ['BUCKET_ID']
topicId = os.environ['TOPIC_ID']
topicName = '%s-%s-%s-%s-%s' % (team, bucketId, topicId, environment, region)
s3Bucket = '%s-%s-%s-%s' % (team, bucketId, environment, region)
retentionLimit = int(os.environ['RETENTION_LIMIT'])
clusterName = '%s-%s-%s' % (team, clusterIdentity, environment)

def sendEmailNotification():
    sns = boto3.client('sns')

    message = dedent(f"""\
        Reason: Redis Backup Lambda Failure
        Region: {region}
        Team: {team}
        Environment: {environment}
        Bucket/Lambda: {s3Bucket}
        
        Please validate the current state of the Lambda
    """)

    try:
        sns.publish(
            TopicArn = f'arn:{arn_region}:sns:{region}:{accountId}:{topicName}',
            Message = message
        )
        logger.info('Email notification sent!')
    except Exception as e:
        logger.error(f'Email notification failed: {e}')

def lambda_handler(event, context):
    try:
        snapshots = memorydb.describe_snapshots(
            ClusterName = clusterName,
            ShowDetail = True
        )

        snapshot_list = []

        for snapshot in snapshots["Snapshots"]:
            snapshot_list.append({
                "Name": snapshot["Name"],
                "SnapshotCreationTime": str(snapshot["ClusterConfiguration"]["Shards"][0]["SnapshotCreationTime"])
            })

        sorted_snapshot_list = sorted(snapshot_list, key=lambda d: d['SnapshotCreationTime'])

        print("List of automatic snapshots in memorydb: ", sorted_snapshot_list)

        latest_snapshot = sorted_snapshot_list[-1]["Name"]

        memorydb.copy_snapshot(
            SourceSnapshotName=latest_snapshot,
            TargetSnapshotName=latest_snapshot,
            TargetBucket=s3Bucket
        )

        print(f"Snapshot - {latest_snapshot} was copied to s3 bucket - {s3Bucket}")

        s3_snapshot_list = s3.list_objects(
            Bucket=s3Bucket
        )

        if 'Contents' in s3_snapshot_list and len(s3_snapshot_list['Contents']) >= retentionLimit:
            sorted_s3_list = sorted(s3_snapshot_list['Contents'], key=lambda d: d['LastModified'])
            s3.delete_object(
                Bucket=s3Bucket,
                Key=str(sorted_s3_list[0]["Key"])
            )
            return f'The snapshot {sorted_s3_list[0]["Key"]} was deleted from s3 bucket - {s3Bucket}'
        return "No snapshot was deleted."

    except Exception as e:
        print(e)
        sendEmailNotification()
        raise e
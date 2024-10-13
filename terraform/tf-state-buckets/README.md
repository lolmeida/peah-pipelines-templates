# Terraform State Buckets

This Terraform configuration sets up an AWS S3 bucket to store Terraform state files and a DynamoDB table for state locking to prevent concurrent state operations that could lead to corruption.

## NOTICE

This is a WIP. TODOs include:
- Create all resources needed so that AWS does not complain about security and best-practices.
- Avoid creating specific bucket / DynamoDB roles (TheRollingModes is administrator)
- Proper tagging on all resources
- Bucket name must be different for PROD / NON-PROD accounts since they must be unique across all AWS accounts in all the AWS Regions within a partition (aws / aws-cn).

## Prerequisites

- Terraform installed
- AWS CLI installed and configured
- Appropriate AWS permissions to create S3 buckets, DynamoDB tables, IAM roles, and policies (TheRollingModes role on the desired region)

## Components

- **S3 Bucket**: Used to store the Terraform state files securely.
- **DynamoDB Table**: Provides locking to prevent concurrent operations on the same state.
- **IAM Role and Policy**: Grants necessary permissions for Terraform to access the S3 bucket and DynamoDB table.

## Usage

To use this Terraform configuration, you should follow these steps:

1. Select the appropriate AWS profile (TheRollingModes role on the desired region)
2. Run the `run.sh` script with the desired AWS region as an argument.

```bash
./run.sh <aws-region>
```

For example:

```bash
./run.sh us-west-2
```

The `run.sh` script will perform the following actions:

- Verify that the AWS CLI is configured for the correct region.
- Check for the existence of a variable file specific to the region.
- Initialize Terraform.
- Apply the Terraform configuration using the region-specific variable file.

## Variables

Variable files should be stored in the `vars` directory and named according to the region they correspond to (e.g., `eu-central-1.tf`).

## Notes

- Ensure that the S3 bucket name is globally unique.
- The DynamoDB table's read and write capacities are set to 5 by default; adjust as necessary.
- The IAM role and policy names are derived from the S3 bucket name.

## Troubleshooting

If you encounter issues with applying the Terraform configuration, check the following:

- AWS CLI is configured with the correct region and credentials.
- The variable file exists for the specified region.
- You have the necessary permissions to create the resources defined in the Terraform configuration.

For more detailed error information, refer to the output of the `terraform apply` command.
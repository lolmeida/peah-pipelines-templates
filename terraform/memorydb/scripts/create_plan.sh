#!/usr/bin/env bash

# exit when any command fails
set -e

S3_BUCKET_NAME=$1
S3_KEY=$2
AWS_REGION=$3
AWS_ENVIRONMENT=$4
APP_ID=$5
MS_ID=$6
COMPASS_ID=$7
TEAM=$8
MEMORYDB_PASSWORD=$9
USER_GROUP_NAME=${10}
SNAPSHOT_RETENTION_LIMIT=${11}
CREATE_S3_BACKUP=${12}
DEPLOY_FOLDER=${13}
DRY_RUN=${14}
SNS_USERS=${*:15}

FAIL_ON_CHANGES=$([ $DRY_RUN = true ] && echo "-detailed-exitcode" || echo "")

cd "${DEPLOY_FOLDER}"

terraform init \
  -backend-config="bucket=$S3_BUCKET_NAME" \
  -backend-config="key=$S3_KEY" \
  -backend-config="region=$AWS_REGION"

terraform plan -out=tfplan -no-color -lock=false -input=false $FAIL_ON_CHANGES \
  -var "aws_region=${AWS_REGION}" \
  -var "environment=${AWS_ENVIRONMENT}" \
  -var "app_id=${APP_ID}" \
  -var "ms_id=${MS_ID}" \
  -var "compass_id=${COMPASS_ID}" \
  -var "team=${TEAM}" \
  -var "authentication_pass=${MEMORYDB_PASSWORD}" \
  -var "user_group_name=${USER_GROUP_NAME}" \
  -var "snapshot_retention_limit=${SNAPSHOT_RETENTION_LIMIT}" \
  -var "create_s3_backup=${CREATE_S3_BACKUP}" \
  -var "sns_users=${SNS_USERS}" \
  -var-file="tfvars.tfvars"

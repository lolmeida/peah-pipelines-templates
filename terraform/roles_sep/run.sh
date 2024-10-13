#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <region> <env>"
    exit 1
fi

REGION=$1
ENV=$2

if [[ "$REGION" != "world" && "$REGION" != "cn" ]]; then
    echo "Invalid region: $REGION. Valid options are 'world' or 'cn'."
    exit 1
fi

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
    echo "Invalid environment: $ENV. Valid options are 'dev' or 'prod'."
    exit 1
fi

S3_BUCKET="ices-trm-$ENV-tf-state"

# Note that since IAM is Global, the region only matters for tf-state buckets and cost tags, which is why only EU / CN are options.
AWS_REGION=$([ "$REGION" == "world" ] && echo "eu-central-1" || echo "cn-north-1")
REGION=$([ "$REGION" == "world" ] && echo "EMEA" || echo "CN")

terraform init -backend-config="bucket=$S3_BUCKET" -backend-config="key=sep-gh-actions-oidc.tfstate" -backend-config="region=$AWS_REGION"

echo "Applying Terraform configuration..."
terraform apply -var="environment=$ENV" -var="region=$REGION"
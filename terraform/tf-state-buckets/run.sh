#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <aws-region>"
    exit 1
fi

REGION=$1

CURRENT_REGION=$(aws configure get region)

# Check if the region matches the expected region
if [ "$CURRENT_REGION" != "$REGION" ]; then
    echo "The AWS profile is configured for region '$CURRENT_REGION', but the expected region is '$REGION'."
    exit 1
fi

VAR_FILE="vars/${REGION}.tf"

if [ ! -f "$VAR_FILE" ]; then
    echo "Variable file for region '${REGION}' does not exist."
    exit 1
fi

terraform init

echo "Applying Terraform configuration..."
terraform apply -var-file="$VAR_FILE"
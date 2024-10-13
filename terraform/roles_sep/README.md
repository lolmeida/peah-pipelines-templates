# Terraform IAM Role Setup for GitHub Actions

This repository contains a Terraform configuration and accompanying script (`run.sh`) to set up an IAM role in AWS that allows GitHub Actions to authenticate using OpenID Connect (OIDC).

## Prerequisites

1. **Terraform**: Install [Terraform](https://www.terraform.io/downloads.html).
2. **AWS CLI**: Configure the AWS CLI with appropriate permissions.
3. **Bash Shell**: Ensure you have a bash shell to run the script.
4. **S3 Bucket for Terraform State**: Create and configure an S3 bucket for storing Terraform state.
5. **OIDC Provider**: The OIDC provider must be created beforehand using Terraform code available in the shared library.

## Repository Structure

- `run.sh`: A script to initialize and apply the Terraform configuration based on specified region and environment.
- `main.tf`: A Terraform configuration file to create IAM roles and policies.
- `vars/`: A directory to store variable files for different regions and environments.

## Usage

### Script: `run.sh`

The `run.sh` script initializes and applies the Terraform configuration. It accepts two parameters: `region` and `env`.

#### Parameters

- `region`: The AWS region. Valid options are `world` or `cn`.
- `env`: The environment. Valid options are `dev` or `prod`.

#### Example

```bash
./run.sh world dev
```

This will:

1. Validate the parameters.
2. Set the S3 bucket for Terraform state.
3. Determine the AWS region based on the region parameter.
4. Initialize Terraform with the appropriate backend configuration.
5. Apply (with a confirmation input) the Terraform configuration with the variables specified in the corresponding variable file.
    
## Variables
The configuration relies on variable files (e.g., vars/world-dev.tf) to store the different policies for different regions and environments.
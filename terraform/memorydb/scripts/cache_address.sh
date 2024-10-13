#!/usr/bin/env bash

# exit when any command fails
set -e

DEPLOY_FOLDER=$1

cd $DEPLOY_FOLDER

terraform output cluster_endpoint_address

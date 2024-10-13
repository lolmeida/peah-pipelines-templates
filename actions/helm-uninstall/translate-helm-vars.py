import os
import re

SPLIT_VAR = "="
INPUT_HELM_VARS = os.environ.get("INPUT_HELM_VARS")
INPUT_EXTRA_HELM_FILES = os.environ.get("EXTRA_HELM_FILES")

HELM_VARS = ""
for char in INPUT_HELM_VARS.splitlines():
    if char != "":
        SPLIT = re.split(SPLIT_VAR, char)
        VAR_NAME = SPLIT[0]
        VAR_ORIGINAL_VALUE = SPLIT_VAR.join(SPLIT[1:])
        VAR_VALUE = os.environ.get(VAR_ORIGINAL_VALUE, default=VAR_ORIGINAL_VALUE)
        HELM_VARS = HELM_VARS + " --set-string " + VAR_NAME + "=" + VAR_VALUE

print(f"::set-output name=HELM_VARS::{HELM_VARS}")

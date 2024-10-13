# Use AWS SSM secrets in GitHub jobs

### Build and deploy

Run command.

```
npm run build
```

Commit the dist folder.

### Usage

To use the action, add a step to your workflow that uses the following syntax.

```
- name: Step name
  uses:  lolmeida/peah-pipelines-templates/actions/aws-ssm@main
  with:
    parameters: |
      SIGNING_KEYSTORE_PASSWORD,/ices/trm/signing_service/emea/test/keystore-password
      SIGNING_KEY_PASSWORD,/ices/trm/signing_service/emea/test/key-password
      SIGNING_TRUSTED_KEYSTORE_PASSWORD, /ices/trm/signing_service/emea/test/truststore-password
      SISE_CERTIFICATE, /ices/trm/signing_service/emea/test/sise-certificate
    with-decryption: (Optional) true|false
```

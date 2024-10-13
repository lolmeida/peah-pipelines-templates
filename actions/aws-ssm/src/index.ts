import * as core from '@actions/core'
import {
    buildSSMList,
    getParameterStoreValue,
    injectEnvVar,
    ParameterStoreAliasValueRequest,
    ParameterStoreValueResponse,
} from "./utils";
import {CLEANUP_NAME} from "./constants";
import {SSMClient} from "@aws-sdk/client-ssm";

export async function run(): Promise<void> {
    try {
        // Default client region is set by configure-aws-credentials
        const client: SSMClient = new SSMClient();
        const parameters: string[] = [...new Set(core.getMultilineInput('parameters'))];
        const parametersIds: ParameterStoreAliasValueRequest[] = await buildSSMList(parameters);
        const withDecryption: boolean = core.getBooleanInput('with-decryption');
        // Keep track of parameter store that will need to be cleaned from the environment
        let parameterStoreToCleanup: string[] = [];

        // Get and inject secret values
        for (const parameterStoreAlias of parametersIds) {
            try {
                const parameterStoreValueResponse: ParameterStoreValueResponse = await getParameterStoreValue(client, parameterStoreAlias, withDecryption);
                const injectedEnvVar: string = injectEnvVar(parameterStoreAlias.alias, parameterStoreValueResponse.value);
                parameterStoreToCleanup = [...parameterStoreToCleanup, injectedEnvVar];
            } catch (error) {
                // Fail action for any error
                core.setFailed(`Failed to fetch parameter store: '${parameterStoreAlias.id}'. Error: ${error}.`)
            }
        }
        // Export the names of variables to clean up after completion
        core.exportVariable(CLEANUP_NAME, JSON.stringify(parameterStoreToCleanup));
        core.info("Completed adding parameter store.");
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run();
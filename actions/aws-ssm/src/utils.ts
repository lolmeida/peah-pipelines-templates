import * as core from '@actions/core'
import {GetParametersCommand, GetParametersCommandOutput, Parameter, SSMClient} from "@aws-sdk/client-ssm";
import "aws-sdk-client-mock-jest";

export interface ParameterStoreValueResponse {
    name: string,
    value: string
}

export interface ParameterStoreAliasValueRequest {
    id: string,
    alias: string
}

/**
 * Retrieves a parameter store from Secrets Manager
 *
 * @param client: SSMClient client
 * @param parameterStore: ParameterStoreAliasValueResponse
 * @param withDecryption: if is to decrypt or not.
 * @returns ParameterStoreValueResponse
 */
export async function getParameterStoreValue(client: SSMClient, parameterStore: ParameterStoreAliasValueRequest, withDecryption: boolean): Promise<ParameterStoreValueResponse> {
    const data: GetParametersCommandOutput = await client.send(new GetParametersCommand({
        Names: [parameterStore.id],
        WithDecryption: withDecryption
    }));

    const parameters: Parameter[] = data.Parameters || [];
    if (parameters.length === 0) {
        throw new Error(`The input '${parameterStore.id}' not exists.`);
    }

    const parameter: Parameter = parameters[0];
    const name = parameter.Name as string;
    const value = parameter.Value?.trim() as string;

    return {
        name: name,
        value: value
    };
}

export function injectEnvVar(envVarName: string, value: string): string {
    core.setSecret(value);
    // Export variable
    core.debug(`Injecting ssm alias ${envVarName} as environment variable.`);
    core.exportVariable(envVarName, value);
    return envVarName;
}


/*
 * Transforms the parameter store name into a valid environmental variable name
 * It should consist of only upper case letters, digits, and underscores and cannot begin with a number
 */
export function transformToValidEnvName(parameterStore: string): string {
    // Leading digits are invalid
    if (parameterStore.match(/^[0-9]/)) {
        parameterStore = '_'.concat(parameterStore);
    }

    // Remove invalid characters
    return parameterStore.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase()
}


export async function buildSSMList(configInputs: string[]): Promise<ParameterStoreAliasValueRequest[]> {
    const finalSecretsList = new Set<ParameterStoreAliasValueRequest>();

    for (const configInput of configInputs) {
        const parameterStoreAliasValueResponse: ParameterStoreAliasValueRequest = extractAliasAndSecretIdFromInput(configInput);
        finalSecretsList.add(parameterStoreAliasValueResponse);
    }

    return [...finalSecretsList];
}

/*
 * Separates a parameter store alias from the parameter name/id, if one was provided
 */
export function extractAliasAndSecretIdFromInput(input: string): ParameterStoreAliasValueRequest {
    const parsedInput = input.split(',');

    if (parsedInput.length != 2) {
        throw new Error(`The input '${input}' is not valid (pair with alias and ssm id is required).`);
    }

    const alias = parsedInput[0].trim();
    const id = parsedInput[1].trim();

    // Validate that the alias is valid environment name
    const validateEnvName = transformToValidEnvName(alias);
    if (alias !== validateEnvName) {
        throw new Error(`The alias '${alias}' is not a valid environment name. Please verify that it has uppercase letters, numbers, and underscore only.`);
    }

    return {
        alias, id
    };

}

/*
 * Cleans up an environment variable
 */
export function cleanVariable(variableName: string) {
    core.exportVariable(variableName, '');
    delete process.env[variableName];
}
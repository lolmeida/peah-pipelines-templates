"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanVariable = exports.extractAliasAndSecretIdFromInput = exports.buildSSMList = exports.transformToValidEnvName = exports.injectEnvVar = exports.getParameterStoreValue = void 0;
const core = __importStar(require("@actions/core"));
const client_ssm_1 = require("@aws-sdk/client-ssm");
require("aws-sdk-client-mock-jest");
/**
 * Retrieves a parameter store from Secrets Manager
 *
 * @param client: SSMClient client
 * @param parameterStore: ParameterStoreAliasValueResponse
 * @param withDecryption: if is to decrypt or not.
 * @returns ParameterStoreValueResponse
 */
function getParameterStoreValue(client, parameterStore, withDecryption) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const data = yield client.send(new client_ssm_1.GetParametersCommand({
            Names: [parameterStore.id],
            WithDecryption: withDecryption
        }));
        const parameters = data.Parameters || [];
        if (parameters.length === 0) {
            throw new Error(`The input '${parameterStore.id}' not exists.`);
        }
        const parameter = parameters[0];
        const name = parameter.Name;
        const value = (_a = parameter.Value) === null || _a === void 0 ? void 0 : _a.trim();
        return {
            name: name,
            value: value
        };
    });
}
exports.getParameterStoreValue = getParameterStoreValue;
function injectEnvVar(envVarName, value) {
    core.setSecret(value);
    // Export variable
    core.debug(`Injecting ssm alias ${envVarName} as environment variable.`);
    core.exportVariable(envVarName, value);
    return envVarName;
}
exports.injectEnvVar = injectEnvVar;
/*
 * Transforms the parameter store name into a valid environmental variable name
 * It should consist of only upper case letters, digits, and underscores and cannot begin with a number
 */
function transformToValidEnvName(parameterStore) {
    // Leading digits are invalid
    if (parameterStore.match(/^[0-9]/)) {
        parameterStore = '_'.concat(parameterStore);
    }
    // Remove invalid characters
    return parameterStore.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
}
exports.transformToValidEnvName = transformToValidEnvName;
function buildSSMList(configInputs) {
    return __awaiter(this, void 0, void 0, function* () {
        const finalSecretsList = new Set();
        for (const configInput of configInputs) {
            const parameterStoreAliasValueResponse = extractAliasAndSecretIdFromInput(configInput);
            finalSecretsList.add(parameterStoreAliasValueResponse);
        }
        return [...finalSecretsList];
    });
}
exports.buildSSMList = buildSSMList;
/*
 * Separates a parameter store alias from the parameter name/id, if one was provided
 */
function extractAliasAndSecretIdFromInput(input) {
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
exports.extractAliasAndSecretIdFromInput = extractAliasAndSecretIdFromInput;
/*
 * Cleans up an environment variable
 */
function cleanVariable(variableName) {
    core.exportVariable(variableName, '');
    delete process.env[variableName];
}
exports.cleanVariable = cleanVariable;

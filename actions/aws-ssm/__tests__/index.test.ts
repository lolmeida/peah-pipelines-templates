import * as core from '@actions/core'
import {mockClient} from "aws-sdk-client-mock";
import {run} from "../src";
import {CLEANUP_NAME} from "../src/constants";
import {GetParametersCommand, SSMClient} from "@aws-sdk/client-ssm";

const DEFAULT_TEST_ENV = {
    AWS_DEFAULT_REGION: 'us-east-1'
};
const smMockClient = mockClient(SSMClient);

// Mock the inputs for Github action
jest.mock('@actions/core', () => {
    return {
        getMultilineInput: jest.fn(),
        getBooleanInput: jest.fn(),
        setFailed: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        exportVariable: jest.fn((name: string, val: string) => process.env[name] = val),
        setSecret: jest.fn(),
    };
});

describe('Test main action', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        smMockClient.reset();
        process.env = {...OLD_ENV, ...DEFAULT_TEST_ENV};
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    test('Retrieves and sets the requested secrets as environment variables, parsing JSON', async () => {
        const booleanSpy = jest.spyOn(core, "getBooleanInput").mockReturnValue(true);
        const multilineInputSpy = jest.spyOn(core, "getMultilineInput").mockReturnValue(
            ['ALIAS_1,/ssm1/test1',
                'ALIAS_2,/ssm1/test2',
                "ALIAS_3,/ssm1/test3"]
        );
        // Mock all Secrets Manager calls
        smMockClient
        .on(GetParametersCommand, {Names: ["/ssm1/test1"], WithDecryption: true})
        .resolves({Parameters: [{Name: "/ssm1/test1", Value: "value-1"}]})
        .on(GetParametersCommand, {Names: ["/ssm1/test2"], WithDecryption: true})
        .resolves({Parameters: [{Name: "/ssm1/test2", Value: "value-2"}]})
        .on(GetParametersCommand, {Names: ["/ssm1/test3"], WithDecryption: true})
        .resolves({Parameters: [{Name: "/ssm1/test3", Value: "value-3"}]});

        await run();
        expect(core.exportVariable).toHaveBeenCalledTimes(4);
        expect(core.setFailed).not.toHaveBeenCalled();

        // JSON secrets should be parsed
        expect(core.exportVariable).toHaveBeenCalledWith('ALIAS_1', 'value-1');
        expect(core.exportVariable).toHaveBeenCalledWith('ALIAS_2', 'value-2');
        expect(core.exportVariable).toHaveBeenCalledWith('ALIAS_3', 'value-3');

        expect(core.exportVariable).toHaveBeenCalledWith(
            CLEANUP_NAME,
            JSON.stringify([
                'ALIAS_1',
                'ALIAS_2',
                "ALIAS_3"
            ])
        );

        booleanSpy.mockClear();
        multilineInputSpy.mockClear();
    });

    test('Fails the action when an error occurs in Secrets Manager', async () => {
        const booleanSpy = jest.spyOn(core, "getBooleanInput").mockReturnValue(true);
        const multilineInputSpy = jest.spyOn(core, "getMultilineInput").mockReturnValue(
            ['ALIAS_1,/ssm1/test1']
        );

        smMockClient.onAnyCommand().resolves({});

        await run();
        expect(core.setFailed).toHaveBeenCalledTimes(1);

        booleanSpy.mockClear();
        multilineInputSpy.mockClear();
    });

    test('Fails the action when multiple secrets exported the same variable name', async () => {
        const booleanSpy = jest.spyOn(core, "getBooleanInput").mockReturnValue(true);
        const multilineInputSpy = jest.spyOn(core, "getMultilineInput").mockReturnValue(
            ['ALIAS_1,/ssm1/test1', 'ALIAS_2,/ssm1/test2', 'ALIAS_3,/ssm1/test3', 'ALIAS_3,/ssm1/test4']
        );

        smMockClient
        .on(GetParametersCommand, {Names: ["/ssm1/test1"], WithDecryption: true})
        .resolves({Parameters: [{Name: "/ssm1/test1", Value: "value-1"}]})
        .on(GetParametersCommand, {Names: ["/ssm1/test2"], WithDecryption: true})
        .resolves({Parameters: [{Name: "/ssm1/test2", Value: "value-2"}]})
        .on(GetParametersCommand, {Names: ["/ssm1/test3"], WithDecryption: true})
        .resolves({Parameters: [{Name: "/ssm1/test3", Value: "value-3"}]});

        await run();
        expect(core.setFailed).toHaveBeenCalledTimes(1);

        booleanSpy.mockClear();
        multilineInputSpy.mockClear();
    });
});
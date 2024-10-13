import * as glob from "glob";
import {readFileSync, statSync} from "fs";
import {GitHub} from "@actions/github/lib/utils";
import {changelog} from "./changelog";

type GitHub = InstanceType<typeof GitHub>;

export interface Config {
    github_token: string;
    github_ref: string;
    github_repository: string;
    // user provided
    input_name?: string;
    input_tag_name?: string;
    input_previous_tag_name?: string;
    input_repository?: string;
    input_body_path?: string;
    input_files?: string[];
    input_draft?: boolean;
    input_prerelease?: boolean;
    input_fail_on_unmatched_files?: boolean;
    input_target_commitish?: string;
    input_discussion_category_name?: string;
    input_generate_release_notes?: boolean;
    input_append_body?: boolean;
    input_make_latest: string | undefined;
}

export const uploadUrl = (url: string): string => {
    const templateMarkerPos = url.indexOf("{");
    if (templateMarkerPos > -1) {
        return url.substring(0, templateMarkerPos);
    }
    return url;
};

export const releaseBody = async (octokit: GitHub, config: Config): Promise<string> => {
    return (
        (config.input_body_path &&
            readFileSync(config.input_body_path).toString("utf8")) ||
        await changelog(octokit, config.input_tag_name || "", config.input_previous_tag_name || "")
    );
};

type Env = { [key: string]: string | undefined };

export const parseInputFiles = (files: string): string[] => {
    return files.split(/\r?\n/).reduce<string[]>(
        (acc, line) =>
            acc
            .concat(line.split(","))
            .filter((pat) => pat)
            .map((pat) => pat.trim()),
        []
    );
};

export const parseConfig = (env: Env): Config => {

    return {
        github_token: env.GITHUB_TOKEN || env.INPUT_TOKEN || "",
        github_ref: env.GITHUB_REF || "",
        github_repository: env.INPUT_REPOSITORY || env.GITHUB_REPOSITORY || "",
        input_name: env.INPUT_NAME,
        input_tag_name: env.INPUT_TAG_NAME ? env.INPUT_TAG_NAME.trim() : undefined,
        input_previous_tag_name: env.INPUT_PREVIOUS_TAG_NAME ? env.INPUT_PREVIOUS_TAG_NAME.trim() : undefined,
        input_body_path: env.INPUT_BODY_PATH,
        input_files: parseInputFiles(env.INPUT_FILES || ""),
        input_draft: env.INPUT_DRAFT ? env.INPUT_DRAFT === "true" : undefined,
        input_prerelease: env.INPUT_PRERELEASE
            ? env.INPUT_PRERELEASE == "true"
            : undefined,
        input_fail_on_unmatched_files: env.INPUT_FAIL_ON_UNMATCHED_FILES == "true",
        input_target_commitish: env.INPUT_TARGET_COMMITISH || undefined,
        input_discussion_category_name:
            env.INPUT_DISCUSSION_CATEGORY_NAME || undefined,
        input_generate_release_notes: env.INPUT_GENERATE_RELEASE_NOTES == "true",
        input_append_body: env.INPUT_APPEND_BODY == "true",
        input_make_latest: env.INPUT_MAKE_LATEST
            ? env.INPUT_MAKE_LATEST
            : undefined,
    };
};

export const paths = (patterns: string[]): string[] => {
    return patterns.reduce((acc: string[], pattern: string): string[] => {
        return acc.concat(
            glob.sync(pattern).filter((path) => statSync(path).isFile())
        );
    }, []);
};

export const unmatchedPatterns = (patterns: string[]): string[] => {
    return patterns.reduce((acc: string[], pattern: string): string[] => {
        return acc.concat(
            glob.sync(pattern).filter((path) => statSync(path).isFile()).length == 0
                ? [pattern]
                : []
        );
    }, []);
};

export const isTag = (ref: string): boolean => {
    return ref.startsWith("refs/tags/");
};

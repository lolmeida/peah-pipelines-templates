import {isTag, parseConfig, paths, unmatchedPatterns, uploadUrl,} from "./util";
import {GitHubReleaser, release, upload} from "./github";
import {getOctokit} from "@actions/github";
import {info, setFailed, setOutput, warning} from "@actions/core";
import moment from "moment";

import {env} from "process";
import {GitHub} from "@actions/github/lib/utils";

type GitHub = InstanceType<typeof GitHub>;

async function run() {
    try {
        setOutput("jira_issues", JSON.stringify([]));
        const config = parseConfig(env);
        if (
            !config.input_tag_name &&
            !config.input_previous_tag_name &&
            !isTag(config.github_ref) &&
            !config.input_draft
        ) {
            throw new Error(`⚠️ GitHub Releases requires a tag and previous tag`);
        }
        if (config.input_files) {
            const patterns = unmatchedPatterns(config.input_files);
            patterns.forEach((pattern) => {
                if (config.input_fail_on_unmatched_files) {
                    throw new Error(`⚠️  Pattern '${pattern}' does not match any files.`);
                } else {
                    warning(`🤔 Pattern '${pattern}' does not match any files.`);
                }
            });
            if (patterns.length > 0 && config.input_fail_on_unmatched_files) {
                throw new Error(`⚠️ There were unmatched files`);
            }
        }

        const gh: GitHub = getOctokit(config.github_token, {
            throttle: {
                onRateLimit: (retryAfter, options) => {
                    warning(
                        `Request quota exhausted for request ${options.method} ${options.url}`
                    );
                    if (options.request.retryCount === 0) {
                        // only retries once
                        info(`Retrying after ${retryAfter} seconds!`);
                        return true;
                    }
                },
                onAbuseLimit: (retryAfter, options) => {
                    // does not retry, only logs a warning
                    warning(
                        `Abuse detected for request ${options.method} ${options.url}`
                    );
                },
            },
        });
        const rel = await release(config, gh, new GitHubReleaser(gh));
        if (config.input_files && config.input_files.length > 0) {
            const files = paths(config.input_files);
            if (files.length == 0) {
                if (config.input_fail_on_unmatched_files) {
                    throw new Error(`⚠️ ${config.input_files} not include valid file.`);
                } else {
                    warning(`🤔 ${config.input_files} not include valid file.`);
                }
            }
            const currentAssets = rel.assets;
            const assets = await Promise.all(
                files.map(async (path) => {
                    const json = await upload(
                        config,
                        gh,
                        uploadUrl(rel.upload_url),
                        path,
                        currentAssets
                    );
                    delete json.uploader;
                    return json;
                })
            ).catch((error) => {
                throw error;
            });
            setOutput("assets", assets);
        }
        info(`🎉 Release ready at ${rel.html_url}`);
        setOutput("url", rel.html_url);
        setOutput("id", rel.id.toString());
        setOutput("upload_url", rel.upload_url);
        const timestamp: number = moment().unix();
        setOutput("release_data", JSON.stringify({version: rel.tag_name, timestamp}).replace(/"/g, '\\"'));
    } catch (error) {
        setFailed(JSON.stringify(error));
    }
}

run();

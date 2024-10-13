import {GitHub} from "@actions/github/lib/utils";
import {Config, isTag, releaseBody} from "./util";
import {readFileSync, statSync} from "fs";
import {getType} from "mime";
import {basename} from "path";
import {info, setFailed} from "@actions/core";

type GitHub = InstanceType<typeof GitHub>;

export interface ReleaseAsset {
    name: string;
    mime: string;
    size: number;
    data: Buffer;
}

export interface Release {
    id: number;
    upload_url: string;
    html_url: string;
    tag_name: string;
    name: string | null;
    body?: string | null | undefined;
    target_commitish: string;
    draft: boolean;
    prerelease: boolean;
    assets: Array<{ id: number; name: string }>;
}

export interface Releaser {
    getReleaseByTag(params: {
        owner: string;
        repo: string;
        tag: string;
    }): Promise<{ data: Release }>;

    createRelease(params: {
        owner: string;
        repo: string;
        tag_name: string;
        name: string;
        body: string | undefined;
        draft: boolean | undefined;
        prerelease: boolean | undefined;
        target_commitish: string | undefined;
        discussion_category_name: string | undefined;
        generate_release_notes: boolean | undefined;
        make_latest: string | undefined;
    }): Promise<{ data: Release }>;

    updateRelease(params: {
        owner: string;
        repo: string;
        release_id: number;
        tag_name: string;
        target_commitish: string;
        name: string;
        body: string | undefined;
        draft: boolean | undefined;
        prerelease: boolean | undefined;
        discussion_category_name: string | undefined;
        generate_release_notes: boolean | undefined;
        make_latest: string | undefined;
    }): Promise<{ data: Release }>;

    allReleases(params: {
        owner: string;
        repo: string;
    }): AsyncIterableIterator<{ data: Release[] }>;
}

export class GitHubReleaser implements Releaser {
    github: GitHub;

    constructor(github: GitHub) {
        this.github = github;
    }

    getReleaseByTag(params: {
        owner: string;
        repo: string;
        tag: string;
    }): Promise<{ data: Release }> {
        return this.github.rest.repos.getReleaseByTag(params);
    }

    createRelease(params: {
        owner: string;
        repo: string;
        tag_name: string;
        name: string;
        body: string | undefined;
        draft: boolean | undefined;
        prerelease: boolean | undefined;
        target_commitish: string | undefined;
        discussion_category_name: string | undefined;
        generate_release_notes: boolean | undefined;
        make_latest: string | undefined;
    }): Promise<{ data: Release }> {
        return this.github.rest.repos.createRelease(params);
    }

    updateRelease(params: {
        owner: string;
        repo: string;
        release_id: number;
        tag_name: string;
        target_commitish: string;
        name: string;
        body: string | undefined;
        draft: boolean | undefined;
        prerelease: boolean | undefined;
        discussion_category_name: string | undefined;
        generate_release_notes: boolean | undefined;
        make_latest: string | undefined;
    }): Promise<{ data: Release }> {
        return this.github.rest.repos.updateRelease(params);
    }

    allReleases(params: {
        owner: string;
        repo: string;
    }): AsyncIterableIterator<{ data: Release[] }> {
        const updatedParams = {per_page: 100, ...params};
        return this.github.paginate.iterator(
            this.github.rest.repos.listReleases.endpoint.merge(updatedParams)
        );
    }
}

export const asset = (path: string): ReleaseAsset => {
    return {
        name: basename(path),
        mime: mimeOrDefault(path),
        size: statSync(path).size,
        data: readFileSync(path),
    };
};

export const mimeOrDefault = (path: string): string => {
    return getType(path) || "application/octet-stream";
};

export const upload = async (
    config: Config,
    github: GitHub,
    url: string,
    path: string,
    currentAssets: Array<{ id: number; name: string }>
): Promise<any> => {
    const [owner, repo] = config.github_repository.split("/");
    const {name, size, mime, data: body} = asset(path);
    const currentAsset = currentAssets.find(
        // note: GitHub renames asset filenames that have special characters, non-alphanumeric characters, and leading or trailing periods. The "List release assets" endpoint lists the renamed filenames.
        // due to this renaming we need to be mindful when we compare the file name we're uploading with a name github may already have rewritten for logical comparison
        // see https://docs.github.com/en/rest/releases/assets?apiVersion=2022-11-28#upload-a-release-asset
        ({name: currentName}) => currentName == name.replace(" ", ".")
    );
    if (currentAsset) {
        info(`♻️ Deleting previously uploaded asset ${name}...`);
        await github.rest.repos.deleteReleaseAsset({
            asset_id: currentAsset.id || 1,
            owner,
            repo,
        });
    }
    info(`⬆️ Uploading ${name}...`);
    const endpoint = new URL(url);
    endpoint.searchParams.append("name", name);
    const resp = await github.request({
        method: "POST",
        url: endpoint.toString(),
        headers: {
            "content-length": `${size}`,
            "content-type": mime,
            authorization: `token ${config.github_token}`,
        },
        data: body,
    });
    const json = resp.data;
    if (resp.status !== 201) {
        throw new Error(
            `Failed to upload release asset ${name}. received status code ${
                resp.status
            }\n${json.message}\n${JSON.stringify(json.errors)}`
        );
    }
    return json;
};

export const release = async (
    config: Config,
    github: GitHub,
    releaser: Releaser,
    maxRetries: number = 3
): Promise<Release> => {
    //todo: implement the retry
    const [owner, repo] = config.github_repository.split("/");
    const tag =
        config.input_tag_name ||
        (isTag(config.github_ref)
            ? config.github_ref.replace("refs/tags/", "")
            : "");

    const discussion_category_name = config.input_discussion_category_name;
    const generate_release_notes = config.input_generate_release_notes;

    try {
        // you can't get a an existing draft by tag
        // so we must find one in the list of all releases
        if (config.input_draft) {
            for await (const response of releaser.allReleases({
                owner,
                repo,
            })) {
                let release = response.data.find((release) => release.tag_name === tag);
                if (release) {
                    return release;
                }
            }
        }
        let existingRelease = await releaser.getReleaseByTag({
            owner,
            repo,
            tag,
        });

        const release_id = existingRelease.data.id;
        let target_commitish: string;
        if (
            config.input_target_commitish &&
            config.input_target_commitish !== existingRelease.data.target_commitish
        ) {
            info(
                `Updating commit from "${existingRelease.data.target_commitish}" to "${config.input_target_commitish}"`
            );
            target_commitish = config.input_target_commitish;
        } else {
            target_commitish = existingRelease.data.target_commitish;
        }

        const tag_name = tag;
        const name = config.input_name || existingRelease.data.name || tag;
        // revisit: support a new body-concat-strategy input for accumulating
        // body parts as a release gets updated. some users will likely want this while
        // others won't previously this was duplicating content for most which
        // no one wants
        const workflowBody = await releaseBody(github, config) || "";
        const existingReleaseBody = existingRelease.data.body || "";
        let body: string;
        if (config.input_append_body && workflowBody && existingReleaseBody) {
            body = existingReleaseBody + "\n" + workflowBody;
        } else {
            body = workflowBody || existingReleaseBody;
        }

        const draft =
            config.input_draft !== undefined
                ? config.input_draft
                : existingRelease.data.draft;
        const prerelease =
            config.input_prerelease !== undefined
                ? config.input_prerelease
                : existingRelease.data.prerelease;

        const make_latest = config.input_make_latest;

        const release = await releaser.updateRelease({
            owner,
            repo,
            release_id,
            tag_name,
            target_commitish,
            name,
            body,
            draft,
            prerelease,
            discussion_category_name,
            generate_release_notes,
            make_latest,
        });
        return release.data;
    } catch (error) {
        if (error.status !== 404) {
            setFailed(`⚠️ Unexpected error fetching GitHub release for tag ${config.github_ref}: ${error}`);
            throw error;
        }

        const tag_name = tag;
        const name = config.input_name || tag;
        const body = await releaseBody(github, config);
        const draft = config.input_draft;
        const prerelease = config.input_prerelease;
        const target_commitish = config.input_target_commitish;
        const make_latest = config.input_make_latest;
        let commitMessage: string = "";
        if (target_commitish) {
            commitMessage = ` using commit "${target_commitish}"`;
        }
        info(`👩‍🏭 Creating new GitHub release for tag ${tag_name}${commitMessage}...`);
        try {
            let release = await releaser.createRelease({
                owner,
                repo,
                tag_name,
                name,
                body,
                draft,
                prerelease,
                target_commitish,
                discussion_category_name,
                generate_release_notes,
                make_latest,
            });
            return release.data;
        } catch (error) {
            // presume a race with competing matrix runs
            info(`⚠️ GitHub release failed with status: ${error.status}`);
            info(`${JSON.stringify(error.response.data)}`);

            switch (error.status) {
                case 403:
                    info(
                        "Skip retry — your GitHub token/PAT does not have the required permission to create a release"
                    );
                    throw error;
                case 404:
                    info("Skip retry - discussion category mismatch");
                    throw error;
                case 422:
                    info("Skip retry - validation failed");
                    throw error;
            }

            info(`retrying... (${maxRetries - 1} retries remaining)`);
            return release(config, github, releaser, maxRetries - 1);
        }
    }
};
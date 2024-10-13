import {info, setFailed, setOutput} from '@actions/core'
import {exec as _exec} from '@actions/exec'
import {context} from '@actions/github'
import {GitHub} from "@actions/github/lib/utils";
import {getJiraIssues, JiraIssue} from "./jira";

type GitHub = InstanceType<typeof GitHub>;
const src = __dirname

export const changelog = async (octokit: GitHub, headRef: string, baseRef: string, reverse: string = "false", fetch: string = "false"): Promise<any> => {
    try {
        const {owner, repo} = context.repo
        const regexp: RegExp = /^[.A-Za-z0-9_/-]*$/

        if (!headRef) {
            headRef = context.sha
        }

        if (!baseRef) {
            const latestRelease = await octokit.rest.repos.getLatestRelease({
                owner,
                repo
            })
            if (latestRelease) {
                baseRef = latestRelease.data.tag_name
            } else {
                setFailed(
                    `There are no releases on ${owner}/${repo}. Tags are not releases.`
                )
            }
        }

        info(`head-ref: ${headRef}`)
        info(`base-ref: ${baseRef}`)

        if (
            !!headRef &&
            !!baseRef &&
            regexp.test(headRef) &&
            regexp.test(baseRef)
        ) {
            return await getChangelog(headRef, baseRef, owner + '/' + repo, reverse, fetch);
        } else {
            setFailed('Branch names must contain only numbers, strings, underscores, periods, forward slashes, and dashes.')
        }
    } catch (error) {
        setFailed(error.message)
    }
}

async function getChangelog(headRef: string, baseRef: string, repoName: string, reverse: string, fetch: string): Promise<string> {
    try {
        let output: string = ''
        let err: string = ''

        // These are option configurations for the @actions/exec lib`
        const options = {listeners: {}, cwd: ""}
        options.listeners = {
            stdout: (data) => {
                output += data.toString()
            },
            stderr: (data) => {
                err += data.toString()
            }
        }
        options.cwd = './'

        await _exec(
            `${src}/scripts/changelog.sh`,
            [headRef, baseRef, repoName, reverse, fetch],
            options
        )

        let changelog = "";
        if (output) {
            info(`Changelog between ${baseRef} and ${headRef}:\n\n${output}`)
            const jiraIssues: JiraIssue[] = await getJiraIssues(output)
            //todo: test the single quotes instead use the replace.
            setOutput("jira_issues", JSON.stringify(jiraIssues).replace(/"/g, '\\"'));
            const changelogFromJira = jiraIssues.map((issue: JiraIssue) => {
                return `[${issue.id}](https://atc.bmwgroup.net/jira/browse/${issue.id}): ${issue.summary}`
            }).join("\n").trim();

            changelog = jiraIssues.length != 0 ? changelogFromJira : output;
        } else {
            setFailed(err)
        }
        return changelog;
    } catch (err) {
        throw new Error(`Could not generate changelog between references because: ${err.message}`)
    }
}








import {info, setFailed, warning} from '@actions/core'
import JiraApi from "jira-client";
import {env} from "process";

export interface JiraIssue {
    id: string;
    summary: string;
}

export async function getJiraIssues(commits: string): Promise<JiraIssue[]> {
    console.info(`getJiraIssues: ${commits}`)
    const regex: RegExp = /INFOTAIN-[0-9]{5,}/g

    const jiraUser = env.ATC_USER;
    const jiraPass = env.ATC_PASSWORD;

    if (!jiraPass || !jiraPass) {
        setFailed("Please inject the ATC_USER and ATC_PASSWORD env vars.")
    }

    try {
        const jira: JiraApi = new JiraApi({
            protocol: 'https',
            host: 'atc.bmwgroup.net/jira',
            username: jiraUser,
            password: jiraPass,
            apiVersion: '2',
            strictSSL: true
        });
        const found = commits.match(regex);
        const uniq = [...new Set(found)];
        const jiraIssues: JiraIssue[] = [];
        for (let i = 0; i < uniq.length; i++) {
            const issue: string = uniq[i];
            try {
                const jiraIssue: JiraIssue = await getJiraIssue(jira, issue)
                jiraIssues.push(jiraIssue);
            } catch (err) {
                warning(`Fail: ${err.message}, it will be ignored.`);
            }
        }
        return jiraIssues
    } catch (err) {
        throw new Error(`Could not generate changelog from jira: ${err.message}`)
    }
}

async function getJiraIssue(jira: JiraApi, issue: string, retry = 1): Promise<JiraIssue> {
    console.info(`getJiraIssue: ${issue}, run get data number: ${retry}`);
    if (retry === 6) {
        throw new Error(`Fail retrieve issue ${issue}`)
    } else {
        try {
            const resultJiraIssue: any = await jira.findIssue(issue);
            const summary = resultJiraIssue.fields.summary;
            return  {id: issue, summary};
        } catch (err) {
            return await getJiraIssue(jira, issue, retry + 1)
        }
    }
}

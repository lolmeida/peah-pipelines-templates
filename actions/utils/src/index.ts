import * as core from '@actions/core'
import semver from 'is-semver';

import {
    ACCOUNTS,
    ARN_PREFIXES,
    CONFLUENCE_PAGES,
    EKS_ROLE,
    ENVS_NO_FEATURE_BRANCHES,
    FULLNAME_ENVS,
    GITHUB_TEAM_NAME,
    GLOBAL_REGIONS,
    NOT_SET,
    PRODUCTS,
    REGIONS,
    RESOURCES,
    RESOURCES_ROLE_NAME,
    TEAM,
    TEAM_Q_NUMBERS,
    CANARY_VIN_REGEX_GENERATOR,
    TEAMS_NOTIFICATIONS_DEPLOYS,
    TEAMS_NOTIFICATIONS_FAIL, NON_PROD_ACCOUNT_ID, CN_NON_PROD_ACCOUNT_ID
} from "./constants";

export async function run(): Promise<void> {
    try {
        const hub: string = core.getInput('hub') || "emea";
        const env: string = core.getInput('env') || "test";

        const product: string = core.getInput('product').toLocaleLowerCase();//service, resources or libs
        //namespace if empty the value is 'ices'
        const namespace: string = core.getInput('namespace').toLocaleLowerCase() || "ices";
        const productKey: string = core.getInput('product-key').toLocaleLowerCase();

        const isActionCall: Boolean = core.getBooleanInput('is-action-call') || false;

        const gitRef: string = core.getInput('git-ref') || NOT_SET;
        const arnPrefix: string = ARN_PREFIXES[hub];
        const accountId: string = ACCOUNTS[`${hub}-${env}`];

        core.debug("env: " + env)
        core.debug("Git Ref: " + gitRef)
        core.debug("Env is pre prod or prod: " + ENVS_NO_FEATURE_BRANCHES.includes(env))
        core.debug("Git ref is a valid semver? " + semver(gitRef))
        core.debug("is action call? " + isActionCall)

        if (isActionCall) {
            core.info(`Skip the validation.`);
        } else {
            if (!PRODUCTS.includes(product)) {
                core.setFailed(`The product ${product} is not valid (valid products ${PRODUCTS.join(", ")}).`);
                return;
            }

            const isResources: Boolean = product === RESOURCES || false;
            core.debug("is resources? " + isResources)

            if (ENVS_NO_FEATURE_BRANCHES.includes(env)) {
                if (isResources && gitRef !== "main" && !semver(gitRef)) {
                    core.setFailed(`The git ref ${gitRef} are not eligible for ${ENVS_NO_FEATURE_BRANCHES.join(" or ")} (only final release are eligible like 1.1.0 or main branch).`);
                    return;
                } else if (!semver(gitRef)) {
                    core.setFailed(`The git ref ${gitRef} are not eligible for ${ENVS_NO_FEATURE_BRANCHES.join(" or ")} (only final release are eligible like 1.1.0).`);
                    return;
                }
            }

        }

        core.setOutput("release_candidate_prefix", "rc");
        core.setOutput("release_hotfix_prefix", "hotfix");
        //GIT
        core.setOutput("git_ref", gitRef);
        core.setOutput("github_team_name", GITHUB_TEAM_NAME);

        core.setOutput("hub", hub);
        core.setOutput("env", env);
        core.setOutput("fullname_env", FULLNAME_ENVS[env]);

        //TEAM/PROJECTS
        core.setOutput("team_q_numbers", TEAM_Q_NUMBERS);
        core.setOutput("team", TEAM);
        //TODO: after migration of services to SEP remove the ternary
        core.setOutput("namespace", namespace);
        core.setOutput("product", product);
        core.setOutput("product_key", productKey);

        //--AWS--
        core.setOutput("resources_role_name", RESOURCES_ROLE_NAME[product]);
        core.setOutput("region", REGIONS[hub]);
        core.setOutput("account_id", accountId);
        core.setOutput("arn_prefix", arnPrefix);
        core.setOutput("base_arn", `arn:${arnPrefix}:iam::${accountId}`);
        core.setOutput("role_arn_eks", `arn:${arnPrefix}:iam::${accountId}:role/${EKS_ROLE(namespace, hub)}`);
        core.setOutput("role_arn_cicd", `arn:${ARN_PREFIXES[hub]}:iam::${accountId}:role/${RESOURCES_ROLE_NAME[product]}`);
        core.setOutput("role_arn_global_resources", `arn:${ARN_PREFIXES[hub]}:iam::${ACCOUNTS[`${hub}-e2e`]}:role/${RESOURCES_ROLE_NAME[product]}`);
        core.setOutput("region_global_resources", GLOBAL_REGIONS[hub]);

        core.setOutput("role_arn_global_resources_row", `arn:${ARN_PREFIXES.emea}:iam::${ACCOUNTS["emea-e2e"]}:role/${RESOURCES_ROLE_NAME[product]}`);
        core.setOutput("role_arn_global_resources_cn", `arn:${ARN_PREFIXES.cn}:iam::${ACCOUNTS["cn-e2e"]}:role/${RESOURCES_ROLE_NAME[product]}`);
        core.setOutput("region_global_resources_row", REGIONS.emea);
        core.setOutput("region_global_resources_cn", REGIONS.cn);

        core.setOutput("eks_name", hub == "cn" ? `iis-cn-${env}` : `iis-${env}`);

        core.setOutput("ecr_repository_url", hub === "cn"
            ? `${CN_NON_PROD_ACCOUNT_ID}.dkr.ecr.cn-north-1.amazonaws.com.cn`
            : `${NON_PROD_ACCOUNT_ID}.dkr.ecr.eu-central-1.amazonaws.com`
        );
        //--CONFLUENCE--
        const confluencePage = CONFLUENCE_PAGES.products[product];


        core.setOutput("confluence_parent_page_id", confluencePage.parentId);
        core.setOutput("confluence_page_release_version_board_page_title", confluencePage.releaseVersionBoardPageTitle);
        core.setOutput("confluence_page_release_notes_page_title", CONFLUENCE_PAGES.releaseNotesBoardPageTitle.replace("__PRODUCT_KEY__", productKey));
        core.setOutput("canary-regex", CANARY_VIN_REGEX_GENERATOR(parseInt(core.getInput("canary-percentage"))));

        //--TEAMS NOTIIFCATIONS--
        const teamsWorkflowsURLByHub = TEAMS_NOTIFICATIONS_DEPLOYS[hub];
        const teamsWorkflowsURL = (teamsWorkflowsURLByHub[productKey] || teamsWorkflowsURLByHub["by-default"]).join(",");

        core.setOutput("teams_notification_deploy_success", teamsWorkflowsURL);
        core.setOutput("teams_notification_deploy_fail", TEAMS_NOTIFICATIONS_FAIL);
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run();
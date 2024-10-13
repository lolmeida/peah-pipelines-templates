"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANARY_VIN_REGEX_GENERATOR = exports.ENVS_NO_FEATURE_BRANCHES = exports.TEAMS_NOTIFICATIONS_FAIL = exports.TEAMS_NOTIFICATIONS_DEPLOYS = exports.REGIONS = exports.TEAM = exports.ACCOUNTS = exports.FULLNAME_ENVS = exports.ARN_PREFIXES = exports.GLOBAL_REGIONS = exports.RESOURCES_ROLE_NAME = exports.EKS_ROLE = exports.CONFLUENCE_PAGES = exports.CN_PROD_ACCOUNT_ID = exports.CN_NON_PROD_ACCOUNT_ID = exports.NON_PROD_ACCOUNT_ID = exports.PROD_ACCOUNT_ID = exports.NOT_SET = exports.TEAM_Q_NUMBERS = exports.GITHUB_TEAM_NAME = exports.PRODUCTS = exports.RESOURCES = void 0;
const SEP = "sep";
const AMBIENT_MUSIC = "am";
exports.RESOURCES = "resources";
const LIBS = "libs";
const PRODUCTS = ["sep", "am", "resources", "libs"];
exports.PRODUCTS = PRODUCTS;
const GITHUB_TEAM_NAME = "therollingmodes";
exports.GITHUB_TEAM_NAME = GITHUB_TEAM_NAME;
//qxz29s1 - Catarina is not included because is not "active" so the creation of issue will fail.
const TEAM_Q_NUMBERS = "qxy7039,qxv9060,qxz38de,qxz3pjo,qxw9076,qxz3ms8";
exports.TEAM_Q_NUMBERS = TEAM_Q_NUMBERS;
const NOT_SET = "_NOT_SET_";
exports.NOT_SET = NOT_SET;
const NON_PROD_ACCOUNT_ID = "786613681215";
exports.NON_PROD_ACCOUNT_ID = NON_PROD_ACCOUNT_ID;
const PROD_ACCOUNT_ID = "112111801379";
exports.PROD_ACCOUNT_ID = PROD_ACCOUNT_ID;
const CN_NON_PROD_ACCOUNT_ID = "071788031674";
exports.CN_NON_PROD_ACCOUNT_ID = CN_NON_PROD_ACCOUNT_ID;
const CN_PROD_ACCOUNT_ID = "178588765489";
exports.CN_PROD_ACCOUNT_ID = CN_PROD_ACCOUNT_ID;
const TEAM = "trm";
exports.TEAM = TEAM;
const REGIONS = { "emea": "eu-central-1", "us": "us-east-1", "cn": "cn-north-1" };
exports.REGIONS = REGIONS;
//Regions used for global resources like ECR
const GLOBAL_REGIONS = { "emea": REGIONS.emea, "us": REGIONS.emea, "cn": REGIONS.cn };
exports.GLOBAL_REGIONS = GLOBAL_REGIONS;
const ENVS_NO_FEATURE_BRANCHES = ["e2e", "prod"];
exports.ENVS_NO_FEATURE_BRANCHES = ENVS_NO_FEATURE_BRANCHES;
const ACCOUNTS = {
    "emea-test": NON_PROD_ACCOUNT_ID,
    "emea-int": NON_PROD_ACCOUNT_ID,
    "emea-e2e": NON_PROD_ACCOUNT_ID,
    "emea-prod": PROD_ACCOUNT_ID,
    "us-prod": PROD_ACCOUNT_ID,
    "us-e2e": NON_PROD_ACCOUNT_ID,
    "cn-e2e": CN_NON_PROD_ACCOUNT_ID,
    "cn-prod": CN_PROD_ACCOUNT_ID
};
exports.ACCOUNTS = ACCOUNTS;
//todo: create all SSM again with new names
const FULLNAME_ENVS = {
    "test": "test",
    "int": "integration",
    "e2e": "e2e",
    "prod": "production"
};
exports.FULLNAME_ENVS = FULLNAME_ENVS;
function EKS_ROLE(namespace, hub) {
    return `orbit/cicd-technical-user-iis${hub === 'cn' ? '-cn' : ''}-${namespace}`;
}
exports.EKS_ROLE = EKS_ROLE;
const RESOURCES_ROLE_NAME = {};
exports.RESOURCES_ROLE_NAME = RESOURCES_ROLE_NAME;
RESOURCES_ROLE_NAME[SEP] = "sep-github-ci";
RESOURCES_ROLE_NAME[AMBIENT_MUSIC] = "am-github-ci";
RESOURCES_ROLE_NAME[exports.RESOURCES] = "sep-github-ci";
RESOURCES_ROLE_NAME[LIBS] = "trm-github-ci";
const ARN_PREFIXES = { "emea": "aws", "us": "aws", "cn": "aws-cn" };
exports.ARN_PREFIXES = ARN_PREFIXES;
const CONFLUENCE_PAGES = {
    "releaseNotesBoardPageTitle": "[__PRODUCT_KEY__] - Release Notes",
    "products": {}
};
exports.CONFLUENCE_PAGES = CONFLUENCE_PAGES;
CONFLUENCE_PAGES.products[AMBIENT_MUSIC] = {
    parentId: "3240251132",
    releaseVersionBoardPageTitle: "Ambient Music - Release Version Board",
};
CONFLUENCE_PAGES.products[SEP] = {
    parentId: "3240251350",
    releaseVersionBoardPageTitle: "SEP - Release Version Board",
};
CONFLUENCE_PAGES.products[exports.RESOURCES] = {
    parentId: "3240251350",
    releaseVersionBoardPageTitle: "SEP - Release Version Board",
};
CONFLUENCE_PAGES.products[LIBS] = {
    parentId: "3240251350",
    releaseVersionBoardPageTitle: "SEP - Release Version Board",
};
// Expected output example: [A-Za-z0-9]{15}(00-49)$ for canaryPercentage = 50
const CANARY_VIN_REGEX_GENERATOR = (canaryPercentage) => {
    if (canaryPercentage === 0) {
        return "canary-header-only";
    }
    if (isNaN(canaryPercentage) || canaryPercentage < 0 || canaryPercentage > 100) {
        throw new Error("Canary percentage should be between 0 and 100, was " + canaryPercentage + ".");
    }
    const end = Math.round(canaryPercentage);
    const range = `00-${(end - 1).toString().padStart(2, '0')}`;
    return `[A-Za-z0-9]{15}(${range})$`;
};
exports.CANARY_VIN_REGEX_GENERATOR = CANARY_VIN_REGEX_GENERATOR;
const TEAMS_NOTIFICATIONS_DEPLOYS = {};
exports.TEAMS_NOTIFICATIONS_DEPLOYS = TEAMS_NOTIFICATIONS_DEPLOYS;
const TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT = {
    "by-default": [
        "https://prod-114.westeurope.logic.azure.com:443/workflows/d33dbe211ea3487d974008c9fbe87ae2/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nPY60B_QEDHAwFUlCTsSOPUByC9lhUdh-KmnYF-qygA",
    ]
};
TEAMS_NOTIFICATIONS_DEPLOYS["emea"] = TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT;
TEAMS_NOTIFICATIONS_DEPLOYS["us"] = TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT;
TEAMS_NOTIFICATIONS_DEPLOYS["cn"] = TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT;
const TEAMS_NOTIFICATIONS_FAIL = "https://prod-194.westeurope.logic.azure.com:443/workflows/dee362dbe8464ba58ff65fde88cb9864/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=07I28FS4_3AhHnEn4etpFFmHy41ut_pGBOETofWDQyA";
exports.TEAMS_NOTIFICATIONS_FAIL = TEAMS_NOTIFICATIONS_FAIL;

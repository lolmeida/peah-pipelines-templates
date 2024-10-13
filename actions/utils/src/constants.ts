const SEP: string = "sep";
const AMBIENT_MUSIC: string = "am";
export const RESOURCES: string = "resources";
const LIBS: string = "libs";

const PRODUCTS = ["sep", "am", "resources", "libs"]

const GITHUB_TEAM_NAME: string = "therollingmodes";

//qxz29s1 - Catarina is not included because is not "active" so the creation of issue will fail.
const TEAM_Q_NUMBERS: string = "qxy7039,qxv9060,qxz38de,qxz3pjo,qxw9076,qxz3ms8";
const NOT_SET: string = "_NOT_SET_";
const NON_PROD_ACCOUNT_ID: string = "786613681215";
const PROD_ACCOUNT_ID: string = "112111801379";
const CN_NON_PROD_ACCOUNT_ID: string = "071788031674";
const CN_PROD_ACCOUNT_ID: string = "178588765489";

const TEAM: string = "trm";
const REGIONS: any = {"emea": "eu-central-1", "us": "us-east-1", "cn": "cn-north-1"};
//Regions used for global resources like ECR
const GLOBAL_REGIONS: any = {"emea": REGIONS.emea, "us": REGIONS.emea, "cn": REGIONS.cn};
const ENVS_NO_FEATURE_BRANCHES: string[] = ["e2e", "prod"];

const ACCOUNTS: any = {
    "emea-test": NON_PROD_ACCOUNT_ID,
    "emea-int": NON_PROD_ACCOUNT_ID,
    "emea-e2e": NON_PROD_ACCOUNT_ID,
    "emea-prod": PROD_ACCOUNT_ID,
    "us-prod": PROD_ACCOUNT_ID,
    "us-e2e": NON_PROD_ACCOUNT_ID,
    "cn-e2e": CN_NON_PROD_ACCOUNT_ID,
    "cn-prod": CN_PROD_ACCOUNT_ID
};

//todo: create all SSM again with new names
const FULLNAME_ENVS: any = {
    "test": "test",
    "int": "integration",
    "e2e": "e2e",
    "prod": "production"
};


function EKS_ROLE(namespace: string, hub: string) {
    return `orbit/cicd-technical-user-iis${hub === 'cn' ? '-cn' : ''}-${namespace}`;
}

const RESOURCES_ROLE_NAME: any = {};

RESOURCES_ROLE_NAME[SEP] = "sep-github-ci";
RESOURCES_ROLE_NAME[AMBIENT_MUSIC] = "am-github-ci";
RESOURCES_ROLE_NAME[RESOURCES] = "sep-github-ci";
RESOURCES_ROLE_NAME[LIBS] = "trm-github-ci";
const ARN_PREFIXES: any = {"emea": "aws", "us": "aws", "cn": "aws-cn"};

const CONFLUENCE_PAGES: any = {
    "releaseNotesBoardPageTitle": "[__PRODUCT_KEY__] - Release Notes",
    "products": {}
};

CONFLUENCE_PAGES.products[AMBIENT_MUSIC] = {
    parentId: "3240251132",
    releaseVersionBoardPageTitle: "Ambient Music - Release Version Board",
};

CONFLUENCE_PAGES.products[SEP] = {
    parentId: "3240251350",
    releaseVersionBoardPageTitle: "SEP - Release Version Board",
};

CONFLUENCE_PAGES.products[RESOURCES] = {
    parentId: "3240251350",
    releaseVersionBoardPageTitle: "SEP - Release Version Board",
};

CONFLUENCE_PAGES.products[LIBS] = {
    parentId: "3240251350",
    releaseVersionBoardPageTitle: "SEP - Release Version Board",
};

// Expected output example: [A-Za-z0-9]{15}(00-49)$ for canaryPercentage = 50
const CANARY_VIN_REGEX_GENERATOR = (canaryPercentage: number) => {
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

const TEAMS_NOTIFICATIONS_DEPLOYS: any = {};

const TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT = {
    "by-default": [
        "https://prod-114.westeurope.logic.azure.com:443/workflows/d33dbe211ea3487d974008c9fbe87ae2/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nPY60B_QEDHAwFUlCTsSOPUByC9lhUdh-KmnYF-qygA",
    ]
}

TEAMS_NOTIFICATIONS_DEPLOYS["emea"] = TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT;
TEAMS_NOTIFICATIONS_DEPLOYS["us"] = TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT;
TEAMS_NOTIFICATIONS_DEPLOYS["cn"] = TEAMS_NOTIFICATIONS_DEPLOYS_DEFAULT

const TEAMS_NOTIFICATIONS_FAIL: string = "https://prod-194.westeurope.logic.azure.com:443/workflows/dee362dbe8464ba58ff65fde88cb9864/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=07I28FS4_3AhHnEn4etpFFmHy41ut_pGBOETofWDQyA";

export {
    PRODUCTS,
    GITHUB_TEAM_NAME,
    TEAM_Q_NUMBERS,
    NOT_SET,
    PROD_ACCOUNT_ID,
    NON_PROD_ACCOUNT_ID,
    CN_NON_PROD_ACCOUNT_ID,
    CN_PROD_ACCOUNT_ID,
    CONFLUENCE_PAGES,
    EKS_ROLE,
    RESOURCES_ROLE_NAME,
    GLOBAL_REGIONS,
    ARN_PREFIXES,
    FULLNAME_ENVS,
    ACCOUNTS,
    TEAM,
    REGIONS,
    TEAMS_NOTIFICATIONS_DEPLOYS,
    TEAMS_NOTIFICATIONS_FAIL,
    ENVS_NO_FEATURE_BRANCHES,
    CANARY_VIN_REGEX_GENERATOR
};


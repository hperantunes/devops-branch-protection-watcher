import {isNullOrUndefined} from "util";
import {GitHubPutProtection} from "./gitHubModels";

const developProtectionDefinition: [string, GitHubPutProtection] = [
    "develop",
    {
        enforce_admins: false,
        restrictions: null,
        required_status_checks: {
            strict: true,
            contexts: getCommaSeparatedEnvironmentVariable("GH_DEVELOP_REQUIRED_STATUS_CHECKS")
        },
        required_pull_request_reviews: {
            dismiss_stale_reviews: false,
            dismissal_restrictions: {}
        }
    }
];

const masterProtectionDefinition: [string, GitHubPutProtection] = [
    "master",
    {
        enforce_admins: false,
        restrictions: {
            users: getCommaSeparatedEnvironmentVariable("GH_MASTER_RESTRICT_TO_USERS"),
            teams: getCommaSeparatedEnvironmentVariable("GH_MASTER_RESTRICT_TO_TEAMS")
        },
        required_status_checks: null,
        required_pull_request_reviews: null
    }
];

export interface Configuration {
    getOrganizationName(): string;
    getRepositoriesToIgnore(): string[];
    getProtectionDefinitions(): Map<string, GitHubPutProtection>;
    getBaseGitHubApiRequestOptions(): RequestOptions;
    getTeamIdsToGrantRepositoriesWriteAccess(): string[];
}

class LocalConfiguration implements Configuration {
    getOrganizationName(): string {
        return getRequiredEnvironmentVariable("GH_ORGANIZATION_NAME").toLowerCase();
    }

    getRepositoriesToIgnore(): string[] {
        return getCommaSeparatedEnvironmentVariable("GH_REPOSITORIES_IGNORE");
    }

    getProtectionDefinitions(): Map<string, GitHubPutProtection> {
        return new Map([
            developProtectionDefinition,
            masterProtectionDefinition
        ]);
    }

    getBaseGitHubApiRequestOptions(): RequestOptions {
        return {
            protocol: "https:",
            host: "api.github.com",
            headers: {
                // See: https://developer.github.com/changes/2016-06-27-protected-branches-api-update/
                accept: "application/vnd.github.loki-preview+json"
            },
            query: {
                access_token: getRequiredEnvironmentVariable("GH_ACCESS_TOKEN")
            }
        };
    }

    getTeamIdsToGrantRepositoriesWriteAccess(): string[] {
        return getCommaSeparatedEnvironmentVariable("GH_REPOSITORIES_ADD_WRITE_PERMISSION_TO_TEAM_IDS");
    }
}

function getRequiredEnvironmentVariable(key: string): string {
    const value = process.env[key];
    if ((value || "").length === 0) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

function getCommaSeparatedEnvironmentVariable(key: string): string[] {
    const values = process.env[key];
    return isNullOrUndefined(values) || /^\s*$/.test(values)
        ? []
        : values.split(",").map((value: string) => value.trim());
}

export interface RequestOptions {
    protocol?: string;
    host?: string;
    path?: string;
    method?: string;
    body?: any;
    headers?: {
        accept: string;
    };
    query?: {
        access_token?: string;
    };
}

export const configuration: Configuration = new LocalConfiguration();

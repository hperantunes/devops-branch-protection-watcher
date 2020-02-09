import {configuration, RequestOptions} from "./configuration";
import {GitHubBranch, GitHubPagination, GitHubProtection, GitHubPutProtection} from "./gitHubModels";
import {request} from "./requestHelper";
import {isNullOrUndefined} from "util";
import * as queryString from "query-string";

const parseLinkHeader = require("parse-link-header");
const URL = require("url-parse");

interface GitHubService {
    getRepositories(): Promise<string[]>;
    getBranchProtection(repository: string, branch: string): Promise<any>;
    setBranchesProtection(repositoryName: string): Promise<any>;
    watchTeamsWritePermissions(repositoryName: string): Promise<any>;
}

class GitHubServiceImplementation implements GitHubService {
    private organization: string;
    private supportedBranches: string[];
    private repositoriesBlacklist: string[];
    private protectionDefinitions: Map<string, GitHubPutProtection>;
    private apiBaseRequestOptions: RequestOptions;

    constructor() {
        this.organization = configuration.getOrganizationName();
        this.protectionDefinitions = configuration.getProtectionDefinitions();
        this.repositoriesBlacklist = configuration.getRepositoriesToIgnore();
        this.apiBaseRequestOptions = configuration.getBaseGitHubApiRequestOptions();
        this.supportedBranches = [...this.protectionDefinitions.keys()];
    }

    async getRepositories(): Promise<string[]> {
        const options = getRepositoriesRequestOptions({
            organization: this.organization
        });
        const repositories: any[] = await this.requestApi(options);
        return repositories
            .filter(repository => !this.repositoriesBlacklist.some(blacklisted => repository.name === blacklisted))
            .map(repository => repository.name);
    }

    async setBranchesProtection(repository: string): Promise<any> {
        const branches: GitHubBranch[] = await this.getBranches(repository);
        const promises = branches.map(async branch => await this.setBranchProtection(repository, branch));
        return await Promise.all(promises);
    }

    async watchTeamsWritePermissions(repositoryName: string): Promise<any> {
        throw new Error("Not implemented: watchTeamsWritePermissions");
    }

    async getBranchProtection(repository: string, branch: string): Promise<GitHubProtection> {
        const options = getProtectionRequestOptions({
            organization: this.organization,
            repository: repository,
            branch: branch
        });
        return await this.requestApi(options);
    }

    private async getBranches(repository: string): Promise<GitHubBranch[]> {
        const options = getBranchRequestOptions({
            organization: this.organization,
            repository: repository
        });
        const branches: any[] = await this.requestApi(options);
        return branches
            .filter(branch => this.supportedBranches.some(supported => branch.name === supported))
            .map(branch => <GitHubBranch>{
                name: branch.name,
                protection: {
                    enabled: branch.protection.enabled
                }
            });
    }

    private async setBranchProtection(repository: string, branch: GitHubBranch): Promise<any> {
        if (!branch.protection.enabled) {
            return await this.setDefaultProtection(repository, branch.name);
        }
        const existingProtection = await this.getBranchProtection(repository, branch.name);

        if (branch.name === "develop") {
            if (existingProtection.required_status_checks && existingProtection.required_status_checks.strict) {
                await this.updateRequiredStatusChecks(repository, branch.name, false);
            }
        }
    }

    private async updateRequiredStatusChecks(repository: string, branch: string, strict: boolean): Promise<any> {
        const requestInfo: RequestInfo = {
            organization: this.organization,
            repository: repository,
            branch: branch
        };
        const options = getPatchRequiredStatusChecksRequestOptions(requestInfo, strict);
        return await this.requestApi(options);
    }

    private async setDefaultProtection(repository: string, branch: string): Promise<any> {
        const requestInfo: RequestInfo = {
            organization: this.organization,
            repository: repository,
            branch: branch
        };
        const protectionDefinition = this.getProtectionDefinition(branch);
        const options = getPutDefaultProtectionRequestOptions(requestInfo, protectionDefinition);
        return await this.requestApi(options);
    }

    private async requestApi(requestOptions?: RequestOptions): Promise<any> {
        const options = {
            ...this.apiBaseRequestOptions,
            ...requestOptions
        };

        console.log("api request:", requestOptions);
        const response = await request(options);
        // TODO: handle retriable errors: 429, etc

        let results = JSON.parse(response.body);
        const nextPage = getNextPageRequestOptions(response);
        if (nextPage) {
            const nextPageResults = await this.requestApi(nextPage);
            results = results.concat(nextPageResults);
        }
        return results;
    }

    private getProtectionDefinition(branch: string): GitHubPutProtection {
        if (!this.protectionDefinitions.has(branch)) {
            throw new Error(`No branch protection defined for ${branch}`);
        }
        return this.protectionDefinitions.get(branch)!;
    }
}

function getNextPageRequestOptions(apiResponse: any): RequestOptions | undefined {
    const pagination: GitHubPagination = parseLinkHeader(apiResponse.headers.link);
    if (!isNullOrUndefined(pagination) && pagination.next) {
        const nextPageUrl = URL(pagination.next.url);
        return {
            path: nextPageUrl.pathname,
            query: queryString.parse(nextPageUrl.query)
        };
    }
}

function getRepositoriesRequestOptions(info: RequestInfo): RequestOptions {
    return {
        path: `/orgs/${info.organization}/repos`
    };
}

function getBranchRequestOptions(info: RequestInfo): RequestOptions {
    return {
        path: `/repos/${info.organization}/${info.repository}/branches`
    };
}

function getProtectionRequestOptions(info: RequestInfo): RequestOptions {
    const branchesPath = getBranchRequestOptions(info).path;
    return {
        path: `${branchesPath}/${info.branch}/protection`
    };
}

function getPutDefaultProtectionRequestOptions(info: RequestInfo, definition: GitHubPutProtection): RequestOptions {
    const protectionPath = getProtectionRequestOptions(info).path;
    return {
        path: protectionPath,
        method: "PUT",
        body: JSON.stringify(definition)
    };
}

function getPatchRequiredStatusChecksRequestOptions(info: RequestInfo, strict: boolean): RequestOptions {
    const protectionPath = getProtectionRequestOptions(info).path;
    const body = {
        strict: strict
    };
    return {
        path: `${protectionPath}/required_status_checks`,
        method: "PATCH",
        body: JSON.stringify(body)
    };
}

type RequestInfo = {
    organization: string,
    repository?: string,
    branch?: string
};

export const gitHubService: GitHubService = new GitHubServiceImplementation();

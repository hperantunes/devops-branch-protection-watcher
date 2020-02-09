// Notes from the api documentation on this request (https://developer.github.com/v3/repos/branches/#update-branch-protection):
// - You can disable dismissal restrictions by passing the dismissal_restrictions object as an empty array. (wrong - it must be empty object instead of empty array)
// - You must pass the following objects: required_status_checks, enforce_admins, and restrictions. They can have the value null for disabled.
export type GitHubPutProtection = {
    required_status_checks: {
        strict: boolean,
        contexts: string[],
    } | null,
    required_pull_request_reviews?: {
        dismissal_restrictions: {
            users: string[],
            teams: string[],
        } | {},
        dismiss_stale_reviews: boolean,
    } | null,
    enforce_admins: boolean,
    restrictions: {
        users: string[],
        teams: string[],
    } | null;
};

export type GitHubProtection = {
    required_status_checks?: {
        strict: boolean,
        contexts: string[]
    },
    required_pull_request_reviews?: {
        dismissal_restrictions?: {
            users: {
                login: string
            }[],
            teams: {
                slug: string
            }[]
        },
        dismiss_stale_reviews: boolean
    },
    enforce_admins: {
        enabled: boolean
    },
    restrictions?: {
        users: {
            login: string
        }[],
        teams: {
            slug: string
        }[]
    }
};

export type GitHubBranch = {
    name: string,
    protection: {
        enabled: boolean
    }
};

export type GitHubPagination = {
    next?: {
        page: string;
        url: string;
    },
    prev?: {
        page: string;
        url: string;
    },
    last?: {
        page: string;
        url: string;
    }
};
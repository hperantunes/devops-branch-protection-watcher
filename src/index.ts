import {gitHubService} from "./gitHubService";

export async function handler(event: any, context: any, callback: (error: any, success?: any) => void) {
    console.log("Event: " + JSON.stringify(event));
    console.log("Context: " + JSON.stringify(context));

    try {
        const repositories = await gitHubService.getRepositories();
        repositories.map(async repository => {
            try {
                return await gitHubService.setBranchesProtection(repository);
            } catch (e) {
                console.error("Failed setting branches protection for repository: %s", repository);
                console.error(e.message);
            }
        });
        callback(null, "Successfully finished!");
    } catch (e) {
        console.error("Exception: %s", e.message);
        callback(e);
    }
}
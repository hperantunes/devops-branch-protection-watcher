require("dotenv").config();
import {gitHubService} from "../src/gitHubService";

const repos = [
    "devops-branch-protection-watcher"
];

async function test() {
    // try {
    //     await Promise.all(repos.map(async repository => {
    //         try {
    //             const results = await gitHubService.setBranchesProtection(repository);
    //             console.log("Protections set for %s: %s", repository, JSON.stringify(results));
    //         } catch (e) {
    //             console.error("Something happened %s", e);  // go on...
    //         }
    //     }));
    // } catch (e) {
    //     console.error("Something CRITICAL happened %s", e);
    // }

    console.log(JSON.stringify(await gitHubService.setBranchesProtection("devops-branch-protection-watcher")));
}

test();

import * as core from "@actions/core";
import { readFileSync } from "fs";

export async function main() {
    const path = core.getInput("path");
    const trim = core.getBooleanInput("trim");

    let content = readFileSync(path, "utf8");
    if (trim) {
        content = content.trim();
    }

    core.setOutput("content", content);
}

main().catch(err => core.setFailed(err.message))

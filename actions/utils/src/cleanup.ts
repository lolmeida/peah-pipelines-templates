import * as core from '@actions/core'


export async function cleanup(): Promise<void> {
    core.info("Cleanup complete.");
}

cleanup();
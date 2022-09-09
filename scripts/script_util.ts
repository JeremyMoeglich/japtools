import { spawnSync } from 'child_process';

export function cmd(cmd: string, allow_error = false, silent = false) {
	const ret = spawnSync(cmd, { shell: true, stdio: silent ? 'pipe' : 'inherit' });
	if (ret.status !== 0 && !allow_error) {
		throw new Error(ret.stderr.toString());
	}
	return ret;
}

export async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

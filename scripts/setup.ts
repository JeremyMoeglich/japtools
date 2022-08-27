import { cmd } from './script_util';

import path from 'path';
import get_root from './get_root.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import 'dotenv/config';

const project_root = get_root();

const dotenv_path = path.join(project_root, '.env');

if (!existsSync(dotenv_path)) {
	throw new Error(`.env file not found at ${dotenv_path}`);
} else if (process.env.WANIKANI_TOKEN === undefined) {
	throw new Error(`WANIKANI_TOKEN not found in .env file`);
} else if (process.env.DATABASE_KEY === undefined) {
	throw new Error(`DATABASE_KEY not found in .env file`);
} else if (process.env.DATABASE_URL === undefined) {
	const database_url = `postgres://postgres:${process.env.DATABASE_KEY}@localhost:5432/postgres?schema=public`;
	console.log(`DATABASE_URL not found in .env file, creating new env variable ${database_url}`);
	process.env.DATABASE_URL = database_url;
	const current_content = readFileSync(dotenv_path, 'utf8');
	const new_content = current_content + `\nDATABASE_URL=${database_url}`;
	writeFileSync(dotenv_path, new_content);
}

{
	const out = cmd('docker info', true, true);
	if (out.status !== 0) {
		if (out.stdout.includes('ERROR: error during connect')) {
			throw new Error('docker is not running, please start it');
		} else {
			throw new Error('Is docker installed?');
		}
	}
	const out2 = cmd('docker compose', true, true);
	if (out2.status !== 0 || !out2.stdout.includes('docker compose [OPTIONS]')) {
		throw new Error('Is docker-compose installed?');
	}
}

cmd(`cd ${path.join(project_root, '/project-setup-rs')} && cargo run --release`);

cmd(`esrun ${path.join(project_root, '/scripts/run.ts')}`);

cmd(
	`cd ${project_root} && prisma migrate dev --name init && prisma generate && vite build && docker compose down`
);

console.log(
	'Setup complete,\n\npnpm preview - start server for last build\npnpm dev - start server and watch for changes\npnpm build - build project'
);

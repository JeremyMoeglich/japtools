import { exec_async } from './script_util';
import path from 'path';
import get_root from './get_root.js';

const project_root = get_root();

(async () => {
	await Promise.all([
		exec_async('cd ./project-setup-rs && cargo run'),
		exec_async(`esrun ${path.join(project_root, '/scripts/build_src.ts')}`)
	]);
	await Promise.all([exec_async('prisma migrate dev --name init'), exec_async('prisma generate')]);
})();

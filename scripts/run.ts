import 'dotenv/config';
import path from 'path';
import { exec_async } from './script_util';
import get_root from './get_root.js';

const project_root = get_root();

Promise.all([
	exec_async(`node ${path.join(project_root, '/scripts/build_src.js')}`),
	exec_async('docker-compose up -d')
]);

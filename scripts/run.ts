import 'dotenv/config';
import get_root from './get_root.js';
import { cmd, sleep } from './script_util';

const project_root = get_root();

cmd(`cd ${project_root} && docker-compose up -d`);

console.log('Waiting for server to start..., 5 seconds');

sleep(5000);

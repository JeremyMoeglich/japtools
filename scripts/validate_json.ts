import get_root from './get_root.js';
import path from 'path';
import fs from 'fs'
import { z } from 'zod';
import { subjectDataOuterSchema } from '$lib/scripts/universal/wanikani_data/wanikani_schema.js';

const root = get_root();
const json_path = path.join(root, 'src/lib/data/wanikani_data.json');

const content = fs.readFileSync(json_path, 'utf8');
const obj = JSON.parse(content);

const validated = z.record(z.string(), subjectDataOuterSchema).parse(obj);

console.log(Object.keys(validated).length);
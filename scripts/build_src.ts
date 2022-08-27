import 'dotenv/config';
import { generate } from 'ts-to-zod';
import { readFileSync, writeFile } from 'fs';
import { join } from 'path';
import get_root from './get_root';

const project_root = get_root();

const base_path = join(project_root, '/src/lib/scripts/universal/wanikani_data');
const from_path = join(base_path, 'wanikani_types.ts');
const to_path = join(base_path, 'wanikani_schema.ts');
const { getZodSchemasFile } = generate({
	sourceText: readFileSync(from_path, 'utf8')
});
const zod_schema_file = getZodSchemasFile(to_path);
writeFile(to_path, zod_schema_file, () => ({}));

import path from 'path';
import { pkgUpSync } from 'pkg-up';

export default function get_root(): string {
	const package_json_path =
		pkgUpSync() ??
		(() => {
			throw new Error('Could not find package.json');
		})();
	return path.dirname(package_json_path);
}

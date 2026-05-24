import { globSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join, relative, dirname } from 'node:path';
import { synchronizeTranslations } from '@ckeditor/ckeditor5-dev-translations';

const args = parseArgs( {
	options: {
		'validate-only': { type: 'boolean', default: false }
	}
} );

const cwd = process.cwd();
const sourceFilesGlob = join( cwd, 'src', '**', '*.[jt]s' );

synchronizeTranslations( {
	sourceFiles: globSync( sourceFilesGlob ),
	packagePaths: [ cwd ],
	corePackagePath: getCorePackagePath( cwd ),
	ignoreUnusedCorePackageContexts: true,
	validateOnly: args.values[ 'validate-only' ],
	skipLicenseHeader: true
} );

function getCorePackagePath( currentWorkingDirectory ) {
	const corePackagePath = dirname(
		fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-core/package.json' ) )
	);

	return relative( currentWorkingDirectory, corePackagePath );
}

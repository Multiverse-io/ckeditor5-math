import { existsSync } from 'node:fs';
import { resolve, isAbsolute, extname } from 'node:path';
import { translations } from '@ckeditor/ckeditor5-dev-build-tools';
import { configDefaults, defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';
import { webdriverio } from '@vitest/browser-webdriverio';
import svg from 'vite-plugin-svgo';
import pkgJson from './package.json' with { type: 'json' };

export default defineConfig( ( { mode } ) => {
	const entry = resolve( import.meta.dirname, 'src/index.ts' );
	const browserBinary = process.platform === 'darwin' ? [
		'/Applications/Chromium.app/Contents/MacOS/Chromium',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	].find( candidate => existsSync( candidate ) ) : undefined;
	const providerCapabilities = browserBinary ? {
		'goog:chromeOptions': {
			binary: browserBinary
		}
	} : {};

	function externals( externalPackages: Record<string, string> ): ( id: string ) => boolean {
		const externalEntries = Object.keys( externalPackages );
		const extensions = [ '.ts', '.mts', '.mjs', '.js', '.json', '.node' ];

		return ( id: string ) => {
			if ( id.startsWith( '.' ) || isAbsolute( id ) ) {
				return false;
			}

			if ( externalEntries.includes( id ) ) {
				return true;
			}

			const packageName = id
				.split( '/' )
				.slice( 0, id.startsWith( '@' ) ? 2 : 1 )
				.join( '/' );

			const extension = extname( id );

			return externalEntries.includes( packageName ) && ( !extension || extensions.includes( extension ) );
		};
	}

	const sharedConfig: ViteUserConfig = {
		root: resolve( import.meta.dirname, 'sample' ),
		plugins: [
			svg()
		],
		build: {
			emptyOutDir: false,
			target: 'es2022'
		},
		test: {
			dir: resolve( import.meta.dirname ),
			include: [
				'tests/**/*.[jt]s'
			],
			exclude: configDefaults.exclude,
			browser: {
				enabled: true,
				instances: [
					{ browser: 'chrome' }
				],
				provider: webdriverio( {
					capabilities: providerCapabilities
				} ),
				headless: true,
				ui: false
			},
			globals: true,
			watch: false,
			coverage: {
				allowExternal: true,
				provider: 'istanbul',
				include: [
					'src/**/*.[jt]s'
				]
			}
		}
	};

	const npmConfig: ViteUserConfig = {
		plugins: [
			translations( {
				source: '**/*.po'
			} )
		],
		build: {
			minify: false,
			outDir: resolve( import.meta.dirname, 'dist' ),
			lib: {
				entry,
				formats: [ 'es' ],
				cssFileName: 'index',
				fileName: ( _format: string, name: string ) => `${ name }.js`
			},
			rolldownOptions: {
				external: externals( {
					...pkgJson.dependencies,
					...pkgJson.peerDependencies
				} )
			}
		}
	};

	const browserConfig: ViteUserConfig = {
		build: {
			minify: true,
			outDir: resolve( import.meta.dirname, 'dist/browser' ),
			lib: {
				entry,
				name: 'CKEditor5Math',
				formats: [ 'es', 'umd' ],
				cssFileName: 'index',
				fileName: ( format: string, name: string ) => `${ name }.${ format }.js`
			},
			rolldownOptions: {
				external: externals( pkgJson.peerDependencies ),
				output: {
					codeSplitting: false,
					globals: {
						ckeditor5: 'CKEDITOR'
					}
				}
			}
		}
	};

	const buildSettings: Record<string, ViteUserConfig> = {
		npm: npmConfig,
		browser: browserConfig
	};

	return mergeConfig( sharedConfig, buildSettings[ mode ] ?? {} );
} );

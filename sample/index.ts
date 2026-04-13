/* global document, window */
declare global {
	interface Window {
		editor: ClassicEditor;
		createMathEditor: ( outputType: 'span' | 'script' ) => Promise<void>;
	}
}

import {
	ClassicEditor,
	Autoformat,
	Base64UploadAdapter,
	BlockQuote,
	Bold,
	Code,
	CodeBlock,
	Essentials,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	Italic,
	Link,
	List,
	MediaEmbed,
	Paragraph,
	Table,
	TableToolbar
} from 'ckeditor5';

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import { Math, AutoformatMath } from '../src/index.js';

import 'ckeditor5/ckeditor5.css';

const LICENSE_KEY = [
	'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzMyNzM1OTksImp0aSI6IjE4OWY5M2Q4LThjNGEtNDY1ZS1iM2NjLTExNjA4NmU5MmIxNSIs',
	'ImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsic2giLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwibGljZW5zZVR5cGUiOiJkZXZlbG9w',
	'bWVudCIsImZlYXR1cmVzIjpbIkRSVVAiLCJETyIsIkZQIiwiU0MiLCJUT0MiLCJUUEwiLCJQT0UiLCJDQyIsIk1GIiwiU0VFIiwiRUNI',
	'IiwiRUlTIiwiTEgiLCJGT08iLCJFMlAiLCJJVyIsIkUyVyJdLCJ2YyI6IjgwZTZiNGY3In0.fxiIg-S7r8GBeN52vnoAsC_OGpFm8Luv',
	'MC_MTHGFUJzNants9MKJ1gPiqGX3ZALW10PTJ4KADhrsLPkcsdM_-w'
].join( '' );

const SHARED_PLUGINS = [
	Math,
	AutoformatMath,
	Essentials,
	Autoformat,
	BlockQuote,
	Bold,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	Italic,
	Link,
	List,
	MediaEmbed,
	Paragraph,
	Table,
	TableToolbar,
	CodeBlock,
	Code,
	Base64UploadAdapter
];

const SHARED_TOOLBAR = [
	'undo',
	'redo',
	'|',
	'math',
	'|',
	'heading',
	'|',
	'bold',
	'italic',
	'link',
	'code',
	'bulletedList',
	'numberedList',
	'|',
	'outdent',
	'indent',
	'|',
	'uploadImage',
	'blockQuote',
	'insertTable',
	'mediaEmbed',
	'codeBlock'
];

function loadTemplate( outputType: 'span' | 'script' ): string {
	const tpl = document.getElementById( `tpl-${ outputType }` ) as HTMLTemplateElement | null;
	if ( !tpl ) {
		throw new Error( `Template #tpl-${ outputType } not found` );
	}
	const div = document.createElement( 'div' );
	div.appendChild( tpl.content.cloneNode( true ) );
	return div.innerHTML;
}

async function createMathEditor( outputType: 'span' | 'script' ): Promise<void> {
	if ( window.editor && typeof window.editor.destroy === 'function' ) {
		await window.editor.destroy();
	}

	const editorEl = document.getElementById( 'editor' )!;
	editorEl.innerHTML = loadTemplate( outputType );

	const editor = await ClassicEditor.create( editorEl, {
		licenseKey: LICENSE_KEY,
		math: {
			engine: 'katex',
			outputType,
			forceOutputType: outputType === 'span',
			katexRenderOptions: {
				macros: {
					'\\test': '\\mathrel{\\char`≠}'
				}
			}
		},
		plugins: SHARED_PLUGINS,
		toolbar: SHARED_TOOLBAR,
		image: {
			toolbar: [
				'imageStyle:inline',
				'imageStyle:block',
				'imageStyle:side',
				'|',
				'imageTextAlternative'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells'
			]
		}
	} );

	window.editor = editor;
	CKEditorInspector.attach( editor );
	window.console.log( `CKEditor 5 is ready (outputType: ${ outputType }).`, editor );
}

window.createMathEditor = createMathEditor;

// Read initial selection from radio buttons
const checkedRadio = document.querySelector<HTMLInputElement>(
	'input[name="outputType"]:checked'
);
const initialType = ( checkedRadio?.value === 'script' ? 'script' : 'span' ) as 'span' | 'script';

// Wire up radio change handler
document.querySelectorAll<HTMLInputElement>( 'input[name="outputType"]' ).forEach( radio => {
	radio.addEventListener( 'change', () => {
		createMathEditor( radio.value as 'span' | 'script' );
	} );
} );

// Create initial editor
createMathEditor( initialType ).catch( err => {
	window.console.error( err.stack );
} );

/* global document, window */
declare global {
	interface Window {
		editor: ClassicEditor;
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

ClassicEditor
	.create( document.getElementById( 'editor' )!, {
		// eslint-disable-next-line max-len
		licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzMyNzM1OTksImp0aSI6IjE4OWY5M2Q4LThjNGEtNDY1ZS1iM2NjLTExNjA4NmU5MmIxNSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsic2giLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwibGljZW5zZVR5cGUiOiJkZXZlbG9wbWVudCIsImZlYXR1cmVzIjpbIkRSVVAiLCJETyIsIkZQIiwiU0MiLCJUT0MiLCJUUEwiLCJQT0UiLCJDQyIsIk1GIiwiU0VFIiwiRUNIIiwiRUlTIiwiTEgiLCJGT08iLCJFMlAiLCJJVyIsIkUyVyJdLCJ2YyI6IjgwZTZiNGY3In0.fxiIg-S7r8GBeN52vnoAsC_OGpFm8LuvMC_MTHGFUJzNants9MKJ1gPiqGX3ZALW10PTJ4KADhrsLPkcsdM_-w',
		math: {
			engine: 'katex',
			katexRenderOptions: {
				macros: {
					'\\test': '\\mathrel{\\char`≠}'
				}
			}
		},
		plugins: [
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
		],
		toolbar: [
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
		],
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
	} )
	.then( editor => {
		window.editor = editor;
		CKEditorInspector.attach( editor );
		window.console.log( 'CKEditor 5 is ready.', editor );
	} )
	.catch( err => {
		window.console.error( err.stack );
	} );

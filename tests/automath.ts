import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Mathematics from '../src/math.js';
import AutoMath from '../src/automath.js';
import {
	ClassicEditor, Clipboard, Paragraph, Undo, Typing, global,
	_getModelData as getData, _setModelData as setData
} from 'ckeditor5';

describe( 'AutoMath - integration', () => {
	let editorElement: HTMLDivElement;
	let editor: ClassicEditor;

	beforeEach( async () => {
		vi.useFakeTimers();

		editorElement = global.document.createElement( 'div' );
		global.document.body.appendChild( editorElement );

		editor = await ClassicEditor.create( editorElement, {
			licenseKey: 'GPL',
			plugins: [ Mathematics, AutoMath, Typing, Paragraph ],
			math: {
				engine: ( equation, element, display ) => {
					if ( display ) {
						element.innerHTML = `\\[${ equation }\\]`;
					} else {
						element.innerHTML = `\\(${ equation }\\)`;
					}
				}
			}
		} );
	} );

	afterEach( () => {
		vi.useRealTimers();
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should load Clipboard plugin', () => {
		expect( editor.plugins.get( Clipboard ) ).to.instanceOf( Clipboard );
	} );

	it( 'should load Undo plugin', () => {
		expect( editor.plugins.get( Undo ) ).to.instanceOf( Undo );
	} );

	it( 'has proper name', () => {
		expect( AutoMath.pluginName ).to.equal( 'AutoMath' );
	} );

	describe( 'delayed replacement', () => {
		it( 'replaces pasted display-math text after 100ms', async () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pastePlainText( '\\[x^2\\]' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\][]</paragraph>'
			);

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'[<mathtex-display display="true" equation="x^2" type="script"></mathtex-display>]'
			);
		} );

		it( 'replaces pasted inline-math text after 100ms', async () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pastePlainText( '\\(x^2\\)' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\(x^2\\)[]</paragraph>'
			);

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>[<mathtex-inline display="false" equation="x^2" type="script"></mathtex-inline>]</paragraph>'
			);
		} );

		it( 'can undo auto-mathing', async () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pastePlainText( '\\[x^2\\]' );

			await vi.advanceTimersByTimeAsync( 100 );

			editor.commands.execute( 'undo' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\][]</paragraph>'
			);
		} );

		it( 'works for non-collapsed selection inside a single element', async () => {
			setData( editor.model, '<paragraph>[Foo]</paragraph>' );
			pastePlainText( '\\[x^2\\]' );

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'[<mathtex-display display="true" equation="x^2" type="script"></mathtex-display>]'
			);
		} );

		it( 'works for non-collapsed selection over multiple elements', async () => {
			setData( editor.model, '<paragraph>Fo[o</paragraph><paragraph>Ba]r</paragraph>' );
			pastePlainText( '\\[x^2\\]' );

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Fo</paragraph>' +
				'[<mathtex-display display="true" equation="x^2" type="script"></mathtex-display>]' +
				'<paragraph>r</paragraph>'
			);
		} );

		it( 'inserts math in-place for a collapsed selection', async () => {
			setData( editor.model, '<paragraph>Foo []Bar</paragraph>' );
			pastePlainText( '\\(x^2\\)' );

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Foo [<mathtex-inline display="false" equation="x^2" type="script"></mathtex-inline>]Bar</paragraph>'
			);
		} );

		it( 'inserts math in-place for a non-collapsed selection', async () => {
			setData( editor.model, '<paragraph>Foo [Bar] Baz</paragraph>' );
			pastePlainText( '\\(x^2\\)' );

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Foo [<mathtex-inline display="false" equation="x^2" type="script"></mathtex-inline>] Baz</paragraph>'
			);
		} );

		it( 'does nothing if pasted text contains multiple equations', async () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pastePlainText( '\\[x^2\\] \\[\\sqrt{x}2\\]' );

			await vi.advanceTimersByTimeAsync( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\] \\[\\sqrt{x}2\\][]</paragraph>'
			);
		} );
	} );

	function pastePlainText( text: string ) {
		editor.editing.view.document.fire( 'clipboardInput', {
			method: 'paste',
			dataTransfer: createDataTransfer( {
				'text/plain': text
			} )
		} );
	}

	function createDataTransfer( initialData: Record<string, string> ) {
		const data = { ...initialData };

		return {
			getData( type: string ) {
				return data[ type ] ?? '';
			},
			setData( type: string, value: string ) {
				data[ type ] = value;
			}
		};
	}
} );

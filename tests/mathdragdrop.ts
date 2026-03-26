import Mathematics from '../src/math.js';
import {
	ClassicEditor, Paragraph, Typing, Undo,
	_getModelData as getData, _setModelData as setData
} from 'ckeditor5';
import { expect } from 'chai';

describe( 'Math - drag and drop', () => {
	let editorElement: HTMLDivElement, editor: ClassicEditor;

	beforeEach( async () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		editor = await ClassicEditor.create( editorElement, {
			plugins: [ Mathematics, Typing, Paragraph, Undo ],
			math: {
				engine: ( equation: string, element: HTMLElement, display: boolean ) => {
					if ( display ) {
						element.innerHTML = '\\[' + equation + '\\]';
					} else {
						element.innerHTML = '\\(' + equation + '\\)';
					}
				}
			}
		} );
	} );

	afterEach( () => {
		editorElement.remove();
		return editor.destroy();
	} );

	describe( 'clipboard roundtrip', () => {
		it( 'should preserve inline math through data downcast → upcast roundtrip', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="e=mc^2" type="script">' +
				'</mathtex-inline>]</paragraph>'
			);

			// Get clipboard HTML (data downcast)
			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.equal( '<script type="math/tex">e=mc^2</script>' );

			// Clear editor
			setData( editor.model, '<paragraph>[]</paragraph>' );

			// Paste HTML back (upcast)
			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );

			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="e=mc^2"' );
		} );

		it( 'should preserve display math through data downcast → upcast roundtrip', () => {
			setData( editor.model, '[<mathtex-display display="true" equation="x^2+y^2=z^2" type="script"></mathtex-display>]' );

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.equal( '<script type="math/tex; mode=display">x^2+y^2=z^2</script>' );

			setData( editor.model, '<paragraph>[]</paragraph>' );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );

			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-display' );
			expect( result ).to.include( 'equation="x^2+y^2=z^2"' );
		} );

		it( 'should preserve inline math with span output type through roundtrip', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="a+b" type="span">' +
				'</mathtex-inline>]</paragraph>'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.include( 'math-tex' );
			expect( html ).to.include( '\\(a+b\\)' );

			setData( editor.model, '<paragraph>[]</paragraph>' );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );

			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="a+b"' );
		} );
	} );

	describe( 'drag and drop simulation', () => {
		it( 'should preserve math widget count when moving inline math to a different paragraph', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="e=mc^2" type="script"></mathtex-inline>]</paragraph>' +
				'<paragraph>Target paragraph</paragraph>'
			);

			// Get selected content (simulates dragstart → clipboardOutput)
			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			// Delete original (simulates move-effect in dragend)
			editor.model.change( () => {
				editor.model.deleteContent( editor.model.document.selection );
			} );

			// Verify original is gone
			expect( getData( editor.model ) ).to.not.include( 'mathtex-inline' );

			// Move selection to target paragraph (simulates drop target)
			const root = editor.model.document.getRoot()!;
			const targetParagraph = root.getChild( 1 )!;
			editor.model.change( writer => {
				writer.setSelection( writer.createPositionAt( targetParagraph, 0 ) );
			} );

			// Insert from clipboard HTML (simulates drop → clipboardInput → contentInsertion)
			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			// Verify math widget exists at new position
			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="e=mc^2"' );
		} );

		it( 'should preserve display math widget when moving to a different position', () => {
			setData( editor.model,
				'[<mathtex-display display="true" equation="\\sum_{i=0}^n x_i" type="script"></mathtex-display>]' +
				'<paragraph>Target paragraph</paragraph>'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			editor.model.change( () => {
				editor.model.deleteContent( editor.model.document.selection );
			} );

			expect( getData( editor.model ) ).to.not.include( 'mathtex-display' );

			const root = editor.model.document.getRoot()!;
			const lastChild = root.getChild( root.childCount - 1 )!;
			editor.model.change( writer => {
				writer.setSelection( writer.createPositionAfter( lastChild ) );
			} );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-display' );
			expect( result ).to.include( 'equation="\\sum_{i=0}^n x_i"' );
		} );
	} );

	describe( 'equation rendering after drag-drop', () => {
		it( 'should re-render equation in DOM after moving inline math to a different paragraph', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="e=mc^2" type="script">' +
				'</mathtex-inline>]</paragraph>' +
				'<paragraph>Target paragraph</paragraph>'
			);

			// Verify equation is rendered in DOM before drag
			let widgetDiv = editorElement.querySelector( '.ck-math-tex div' );
			expect( widgetDiv ).to.not.be.null;
			expect( widgetDiv!.innerHTML ).to.not.equal( '' );
			const renderedBefore = widgetDiv!.innerHTML;

			// Simulate drag-drop: get clipboard content
			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			// Delete original (simulates move-effect in dragend)
			editor.model.change( () => {
				editor.model.deleteContent( editor.model.document.selection );
			} );

			// Move selection to target paragraph (simulates drop target)
			const root = editor.model.document.getRoot()!;
			const targetParagraph = root.getChild( 1 )!;
			editor.model.change( writer => {
				writer.setSelection( writer.createPositionAt( targetParagraph, 0 ) );
			} );

			// Insert from clipboard HTML (simulates drop)
			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			// Verify equation is RENDERED in DOM after drop (not just in model)
			widgetDiv = editorElement.querySelector( '.ck-math-tex div' );
			expect( widgetDiv ).to.not.be.null;
			expect( widgetDiv!.innerHTML ).to.not.equal( '' );
			expect( widgetDiv!.innerHTML ).to.equal( renderedBefore );
		} );

		it( 'should re-render display equation in DOM after moving to a different position', () => {
			setData( editor.model,
				'[<mathtex-display display="true" equation="x^2+y^2=z^2" type="script"></mathtex-display>]' +
				'<paragraph>Target paragraph</paragraph>'
			);

			let widgetDiv = editorElement.querySelector( '.ck-math-tex div' );
			expect( widgetDiv ).to.not.be.null;
			expect( widgetDiv!.innerHTML ).to.not.equal( '' );
			const renderedBefore = widgetDiv!.innerHTML;

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			editor.model.change( () => {
				editor.model.deleteContent( editor.model.document.selection );
			} );

			const root = editor.model.document.getRoot()!;
			const lastChild = root.getChild( root.childCount - 1 )!;
			editor.model.change( writer => {
				writer.setSelection( writer.createPositionAfter( lastChild ) );
			} );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			widgetDiv = editorElement.querySelector( '.ck-math-tex-display div' );
			expect( widgetDiv ).to.not.be.null;
			expect( widgetDiv!.innerHTML ).to.not.equal( '' );
			expect( widgetDiv!.innerHTML ).to.equal( renderedBefore );
		} );
	} );

	describe( 'widget DOM structure', () => {
		it( 'should set draggable="false" on inner UIElement to prevent native browser drag', () => {
			setData( editor.model,
				'<paragraph><mathtex-inline display="false" equation="x" type="script"></mathtex-inline>[]</paragraph>'
			);

			const widgetEl = editorElement.querySelector( '.ck-widget.ck-math-tex' );
			expect( widgetEl ).to.not.be.null;

			const innerDiv = widgetEl!.querySelector( 'div' );
			expect( innerDiv ).to.not.be.null;
			expect( innerDiv!.getAttribute( 'draggable' ) ).to.equal( 'false' );
		} );
	} );
} );

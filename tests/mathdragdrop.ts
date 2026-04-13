import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Mathematics from '../src/math.js';
import {
	ClassicEditor, Paragraph, Typing, Undo,
	_getModelData as getData, _setModelData as setData
} from 'ckeditor5';

function getEditableElement( editor: ClassicEditor ): HTMLElement {
	const editableElement = editor.ui.getEditableElement();

	if ( !editableElement ) {
		throw new Error( 'Missing editable element' );
	}

	return editableElement;
}

describe( 'Math - drag and drop', () => {
	let editorElement: HTMLDivElement, editor: ClassicEditor;

	beforeEach( async () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		editor = await ClassicEditor.create( editorElement, {
			licenseKey: 'GPL',
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

			const renderedBefore = '\\(e=mc^2\\)';

			expect( getEditableElement( editor ).textContent ).to.contain( renderedBefore );

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

			expect( getEditableElement( editor ).textContent ).to.contain( renderedBefore );
		} );

		it( 'should re-render inline math nested inside an inserted paragraph', () => {
			setData( editor.model, '<paragraph>Target paragraph</paragraph>' );

			const root = editor.model.document.getRoot()!;
			const targetParagraph = root.getChild( 0 )!;

			editor.model.change( writer => {
				const paragraph = writer.createElement( 'paragraph' );
				const inlineMath = writer.createElement( 'mathtex-inline', {
					display: false,
					equation: 'e=mc^2',
					type: 'script'
				} );
				const fragment = writer.createDocumentFragment();

				writer.append( paragraph, fragment );
				writer.appendText( 'Before ', paragraph );
				writer.append( inlineMath, paragraph );
				writer.appendText( ' after', paragraph );

				editor.model.insertContent( fragment, writer.createPositionAfter( targetParagraph ) );
			} );

			const result = getData( editor.model );
			expect( root.childCount ).to.equal( 2 );
			expect( result ).to.contain( 'Target paragraph' );
			expect( result ).to.contain( '<mathtex-inline display="false" equation="e=mc^2" type="script"></mathtex-inline>' );

			expect( getEditableElement( editor ).textContent ).to.contain( '\\(e=mc^2\\)' );
		} );

		it( 'should re-render display equation in DOM after moving to a different position', () => {
			setData( editor.model,
				'[<mathtex-display display="true" equation="x^2+y^2=z^2" type="script"></mathtex-display>]' +
				'<paragraph>Target paragraph</paragraph>'
			);

			const renderedBefore = '\\[x^2+y^2=z^2\\]';

			expect( getEditableElement( editor ).textContent ).to.contain( renderedBefore );

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

			expect( getEditableElement( editor ).textContent ).to.contain( renderedBefore );
		} );

		it( 'should render inline math nested inside pasted paragraph content', () => {
			setData( editor.model, '<paragraph>Target paragraph</paragraph>' );

			const html = '<p>Before <script type="math/tex">a+b</script> after</p>';
			const root = editor.model.document.getRoot()!;
			const targetParagraph = root.getChild( 0 )!;

			editor.model.change( writer => {
				writer.setSelection( writer.createPositionAfter( targetParagraph ) );
			} );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.contain( 'equation="a+b"' );
			expect( getEditableElement( editor ).textContent ).to.contain( '\\(a+b\\)' );
		} );
	} );

	describe( 'widget DOM structure', () => {
		it( 'should set draggable="false" on inner UIElement to prevent native browser drag', () => {
			setData( editor.model,
				'<paragraph><mathtex-inline display="false" equation="x" type="script"></mathtex-inline>[]</paragraph>'
			);

			const innerElement = getEditableElement( editor ).querySelector( '[draggable="false"]' );
			expect( innerElement ).to.not.be.null;
			expect( innerElement!.getAttribute( 'draggable' ) ).to.equal( 'false' );
		} );
	} );
} );

describe( 'Math - outputType and forceOutputType', () => {
	describe( 'with outputType: "span", forceOutputType: true', () => {
		let editorElement: HTMLDivElement, editor: ClassicEditor;

		beforeEach( async () => {
			editorElement = document.createElement( 'div' );
			document.body.appendChild( editorElement );

			editor = await ClassicEditor.create( editorElement, {
				licenseKey: 'GPL',
				plugins: [ Mathematics, Typing, Paragraph, Undo ],
				math: {
					engine: ( equation: string, element: HTMLElement, display: boolean ) => {
						if ( display ) {
							element.innerHTML = '\\[' + equation + '\\]';
						} else {
							element.innerHTML = '\\(' + equation + '\\)';
						}
					},
					outputType: 'span',
					forceOutputType: true
				}
			} );
		} );

		afterEach( () => {
			editorElement.remove();
			return editor.destroy();
		} );

		it( 'should downcast inline math as span with math-tex class', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="a+b" type="span">' +
				'</mathtex-inline>]</paragraph>'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.include( 'math-tex' );
			expect( html ).to.include( '\\(a+b\\)' );
			expect( html ).to.not.include( '<script' );
		} );

		it( 'should force span output type on upcast from script tags', () => {
			editor.data.set(
				'<p><script type="math/tex">x^2</script></p>'
			);

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="x^2"' );
			expect( result ).to.include( 'type="span"' );
		} );

		it( 'should preserve span math through clipboard roundtrip', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="e=mc^2" type="span">' +
				'</mathtex-inline>]</paragraph>'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.include( 'math-tex' );

			setData( editor.model, '<paragraph>[]</paragraph>' );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="e=mc^2"' );
			expect( result ).to.include( 'type="span"' );
		} );

		it( 'should preserve math widget through drag-drop simulation with span output', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="e=mc^2" type="span">' +
				'</mathtex-inline>]</paragraph>' +
				'<paragraph>Target paragraph</paragraph>'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.not.include( '<script' );

			editor.model.change( () => {
				editor.model.deleteContent( editor.model.document.selection );
			} );

			const root = editor.model.document.getRoot()!;
			const targetParagraph = root.getChild( 1 )!;
			editor.model.change( writer => {
				writer.setSelection( writer.createPositionAt( targetParagraph, 0 ) );
			} );

			const viewFragment = editor.data.processor.toView( html );
			const modelFragment = editor.data.toModel( viewFragment );
			editor.model.insertContent( modelFragment );

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="e=mc^2"' );
			expect( result ).to.include( 'type="span"' );
		} );
	} );

	describe( 'with outputType: "script", forceOutputType: false (defaults)', () => {
		let editorElement: HTMLDivElement, editor: ClassicEditor;

		beforeEach( async () => {
			editorElement = document.createElement( 'div' );
			document.body.appendChild( editorElement );

			editor = await ClassicEditor.create( editorElement, {
				licenseKey: 'GPL',
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
			return editor?.destroy();
		} );

		it( 'should downcast inline math as script with math/tex type', () => {
			setData( editor.model,
				'<paragraph>[<mathtex-inline display="false" equation="a+b" type="script">' +
				'</mathtex-inline>]</paragraph>'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.equal( '<script type="math/tex">a+b</script>' );
		} );

		it( 'should downcast display math as script with mode=display', () => {
			setData( editor.model,
				'[<mathtex-display display="true" equation="x^2" type="script"></mathtex-display>]'
			);

			const selectedContent = editor.model.getSelectedContent( editor.model.document.selection );
			const viewContent = editor.data.toView( selectedContent );
			const html = editor.data.processor.toData( viewContent );

			expect( html ).to.equal( '<script type="math/tex; mode=display">x^2</script>' );
		} );

		it( 'should preserve original type attribute when forceOutputType is false', () => {
			editor.data.set(
				'<p><span class="math-tex">\\(y=mx+b\\)</span></p>'
			);

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="y=mx+b"' );
			expect( result ).to.include( 'type="span"' );
		} );

		it( 'should preserve script type from script tags when forceOutputType is false', () => {
			editor.data.set(
				'<p><script type="math/tex">z^3</script></p>'
			);

			const result = getData( editor.model );
			expect( result ).to.include( 'mathtex-inline' );
			expect( result ).to.include( 'equation="z^3"' );
			expect( result ).to.include( 'type="script"' );
		} );
	} );
} );

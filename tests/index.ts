import { describe, expect, it } from 'vitest';
import { Math as MathDll, icons } from '../src/index.js';
import Math from '../src/math.js';

import mathIcon from './../theme/icons/math.svg';

describe( 'CKEditor5 Math exports', () => {
	it( 'exports Math', () => {
		expect( MathDll ).to.equal( Math );
	} );

	describe( 'icons', () => {
		it( 'exports the "math" icon', () => {
			expect( icons.math ).to.equal( mathIcon );
		} );
	} );
} );

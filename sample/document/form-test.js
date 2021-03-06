#!/usr/bin/env node
/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox test suite
	
	Copyright (c) 2009 - 2015 Cédric Ronvel 
	
	The MIT License (MIT)
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

/* jshint unused:false */



//console.error( "\n\n\n\n\n\n\n\n" ) ;
termkit = require( '../../lib/termkit.js' ) ;
term = termkit.terminal ;



term.clear() ;

var document = term.createDocument() ;


var form = termkit.Form.create( {
	parent: document ,
	x: 10 ,
	y: 10 ,
	width: 40 ,
	textInputs: [
		{
			key: 'firstName' ,
			label: 'first name: ' ,
			validator: { type: 'string' }
		} ,
		{
			key: 'lastName' ,
			label: 'last name: ' ,
			validator: { type: 'string' }
		} ,
		{
			key: 'age' ,
			label: 'age: ' ,
			validator: { type: 'string' }
		}
	] ,
	buttons: [
		{
			content: '<Ok>' ,
			value: 'ok'
		} ,
		{
			content: '<Cancel>' ,
			value: 'cancel'
		}
	]
} ) ;



form.on( 'submit' , onSubmit ) ;

function onSubmit( buttonValue , values )
{
	//console.error( 'Submitted: ' , value ) ;
	term.saveCursor() ;
	term.moveTo.styleReset.eraseLine( 1 , 22 , 'Submitted: %s %J\n' , buttonValue , values ) ;
	term.restoreCursor() ;
}



document.focusNext() ;

term.on( 'key' , function( key ) {
	switch( key )
	{
		case 'CTRL_C' :
			term.grabInput( false ) ;
			term.hideCursor( false ) ;
			term.styleReset() ;
			term.clear() ;
			process.exit() ;
			break ;
	}
} ) ;




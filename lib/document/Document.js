/*
	The Cedric's Swiss Knife (CSK) - CSK terminal toolbox
	
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



// Load modules
var Element = require( './Element.js' ) ;
var Container = require( './Container.js' ) ;
var ScreenBuffer = require( '../ScreenBuffer.js' ) ;


function Document() { throw new Error( 'Use Document.create() instead' ) ; }
module.exports = Document ;
//Document.prototype = Object.create( Element.prototype ) ;
Document.prototype = Object.create( Container.prototype ) ;
Document.prototype.constructor = Document ;
Document.prototype.elementType = 'Document' ;



Document.create = function createDocument( options )
{
	var document = Object.create( Document.prototype ) ;
	document.create( options ) ;
	return document ;
} ;



Document.prototype.create = function create( options )
{
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	options.outputX = 1 ;
	options.outputY = 1 ;
	options.outputWidth = options.outputDst.width ;
	options.outputHeight = options.outputDst.height ;
	
	//Element.prototype.create.call( this , options ) ;
	Container.prototype.create.call( this , options ) ;
	
	// A document do not have parent
	this.parent = null ;
	
	// The document of a document is itself
	this.document = this ;
	
	// Being the top-level element before the Terminal object, this must use delta-drawing
	this.deltaDraw = true ;
	
	Object.defineProperties( this , {
		id: { value: '_document' + '_' + ( nextId ++ ) , enumerable: true } ,
		eventSource: { value: options.eventSource } ,
		focusElement: { value: null , enumerable: true , writable: true } ,
		elements: { value: {} , enumerable: true } ,
		onEventSourceKey: { value: this.onEventSourceKey.bind( this ) , enumerable: true } ,
		onEventSourceMouse: { value: this.onEventSourceMouse.bind( this ) , enumerable: true } ,
		onEventSourceResize: { value: this.onEventSourceResize.bind( this ) , enumerable: true } ,
	} ) ;
	
	this.eventSource.grabInput( { mouse: 'motion' } ) ;
	//this.eventSource.grabInput( { mouse: 'button' } ) ;
	
	this.eventSource.on( 'key' , this.onEventSourceKey ) ;
	this.eventSource.on( 'mouse' , this.onEventSourceMouse ) ;
	this.eventSource.on( 'resize' , this.onEventSourceResize ) ;
	
	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'Document' ) { this.draw() ; }
} ;



Document.prototype.destroy = function destroy( isSubDestroy )
{
	this.eventSource.off( 'key' , this.onEventSourceKey ) ;
	this.eventSource.off( 'mouse' , this.onEventSourceMouse ) ;
	this.eventSource.off( 'resize' , this.onEventSourceResize ) ;
	
	Element.prototype.destroy.call( this , isSubDestroy ) ;
} ;



// Next element ID
var nextId = 0 ;

Document.prototype.assignId = function assignId( element , id )
{
	if ( ! id || typeof id !== 'string' || id[ 0 ] === '_' || this.elements[ id ] )
	{
		id = '_' + element.elementType + '_' + ( nextId ++ ) ;
	}
	
	Object.defineProperty( element , 'id' , { value: id , enumerable: true , configurable: true } ) ;
	this.elements[ id ] = element ;
} ;



Document.prototype.giveFocusTo = function giveFocusTo( element )
{
	if ( this.isAncestorOf( element ) ) { return this.giveFocusTo_( element ) ; }
} ;



Document.prototype.giveFocusTo_ = function giveFocusTo_( element )
{
	if ( this.focusElement !== element )
	{
		if ( this.focusElement ) { this.focusElement.emit( 'focus' , false , this.focusElement ) ; }
		this.focusElement = element ;
		this.focusElement.emit( 'focus' , true , this.focusElement ) ;
		
		/*
		console.error(
			'Giving focus to' , this.focusElement.content ,
			this.focusElement.listenerCount( 'focus' ) ,
			this.focusElement.listenerCount( 'key' )
		) ;
		*/
	}
	
	// Return false if the focus was given to a element that does not care about focus and key event
	return ( this.focusElement.listenerCount( 'focus' ) || this.focusElement.listenerCount( 'key' ) ) ;
} ;



Document.prototype.focusNext = function focusNext()
{
	var index , startingElement , currentElement , focusAware ;
	
	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }
	
	startingElement = currentElement ;
	
	while ( true )
	{
		if ( currentElement.children.length )
		{
			// Give focus to the first child of the element
			currentElement = currentElement.children[ 0 ] ;
			focusAware = this.giveFocusTo_( currentElement ) ;
		}
		else if ( currentElement.parent )
		{
			while ( true )
			{
				index = currentElement.parent.children.indexOf( currentElement ) ;
				
				if ( index + 1 < currentElement.parent.children.length )
				{
					// Give focus to the next sibling
					currentElement = currentElement.parent.children[ index + 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
				else if ( currentElement.parent.parent )
				{
					currentElement = currentElement.parent ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the first-top-level child
					currentElement = currentElement.parent.children[ 0 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
			}
		}
		else
		{
			// Nothing to do: no children, no parent, nothing...
			return ;
		}
		
		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		//console.error( 'end of loop: ' , focusAware , startingElement.content , currentElement.content ) ;
		if ( focusAware || startingElement === currentElement ) { break ; }
	}
} ;



Document.prototype.focusPrevious = function focusPrevious()
{
	var index , startingElement , currentElement , focusAware ;
	
	if ( ! this.focusElement || ! this.isAncestorOf( this.focusElement ) ) { currentElement = this ; }
	else { currentElement = this.focusElement ; }
	
	startingElement = currentElement ;
	
	while ( true )
	{
		if ( currentElement.parent )
		{
			while ( true )
			{
				index = currentElement.parent.children.indexOf( currentElement ) ;
				
				if ( index - 1 >= 0 )
				{
					// Give focus to the previous sibling
					currentElement = currentElement.parent.children[ index - 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
				else if ( currentElement.parent.parent )
				{
					currentElement = currentElement.parent ;
				}
				else
				{
					// We are at the top-level, just below the document, so cycle again at the last-top-level child
					currentElement = currentElement.parent.children[ currentElement.parent.children.length - 1 ] ;
					focusAware = this.giveFocusTo_( currentElement ) ;
					break ;
				}
			}
		}
		else if ( currentElement.children.length )
		{
			// Give focus to the last child of the element
			currentElement = currentElement.children[ currentElement.children.length - 1 ] ;
			focusAware = this.giveFocusTo_( currentElement ) ;
		}
		else
		{
			// Nothing to do: no children, no parent, nothing...
			return ;
		}
		
		// Exit if the focus was given to a focus-aware element or if we have done a full loop already
		//console.error( 'end of loop: ' , focusAware , startingElement.content , currentElement.content ) ;
		if ( focusAware || startingElement === currentElement ) { break ; }
	}
} ;



Document.prototype.onEventSourceKey = function onEventSourceKey( key , trash , data )
{
	if ( this.focusElement )
	{
		this.bubblingEvent( this.focusElement , key , trash , data ) ;
	}
	else
	{
		this.defaultKeyHandling( key , trash , data ) ;
	}
} ;



Document.prototype.bubblingEvent = function bubblingEvent( element , key , trash , data )
{
	var self = this ;
	
	if ( element !== this )
	{
		element.emit( 'key' , key , trash , data , function( interruption , event ) {
			
			if ( ! interruption )
			{
				if ( element.parent ) { self.bubblingEvent( element.parent , key , trash , data ) ; }
				else { self.defaultKeyHandling( key , trash , data ) ; }
			}
		} ) ;
	}
	else
	{
		this.defaultKeyHandling( key , trash , data ) ;
	}
} ;



Document.prototype.defaultKeyHandling = function defaultKeyHandling( key , trash , data )
{
	this.emit( 'key' , key , trash , data ) ;
	
	switch ( key )
	{
		case 'TAB' :
			this.focusNext() ;
			break ;
		case 'SHIFT_TAB' :
			this.focusPrevious() ;
			break ;
	}
} ;



Document.prototype.onEventSourceMouse = function onEventSourceMouse( name , data )
{
	var matches ;
	
	switch ( name )
	{
		case 'MOUSE_LEFT_BUTTON_PRESSED' :
			matches = this.childrenAt( data.x - this.outputX , data.y - this.outputY ) ;
			//console.error( "\n\n\n\n" , matches ) ;
			
			if ( ! matches.length ) { return ; }
			
			matches[ 0 ].element.emit( 'click' , { x: matches[ 0 ].x , y: matches[ 0 ].y } , matches[ 0 ].element ) ;
			break ;
			
		case 'MOUSE_MOTION' :
			// Unflood mouse motions
			if ( this.mouseMotionTimer ) { clearTimeout( this.mouseMotionTimer ) ; }
			this.mouseMotionTimer = setTimeout( this.mouseMotion.bind( this , data ) , 50 ) ;
			break ;
	}
} ;



Document.prototype.mouseMotion = function mouseMotion( data )
{
	var matches ;
	
	this.mouseMotionTimer = null ;
	
	matches = this.childrenAt( data.x - this.outputX , data.y - this.outputY ) ;
	//console.error( "\n\n\n\n" , matches ) ;
	
	if ( ! matches.length ) { return ; }
	
	matches[ 0 ].element.emit( 'hover' , { x: matches[ 0 ].x , y: matches[ 0 ].y } , matches[ 0 ].element ) ;
} ;



Document.prototype.onEventSourceResize = function onEventSourceResize( width , height )
{
	//console.error( "Document#onEventSourceResize() " , width , height ) ;
	
	// Always resize inputDst to match outputDst (Terminal)
	this.resizeInput( {
		x: 0 ,
		y: 0 ,
		width: width ,
		height: height
	} ) ;
	
	//this.inputDst.clear() ;
	//this.postDrawSelf() ;
	
	this.draw() ;
} ;





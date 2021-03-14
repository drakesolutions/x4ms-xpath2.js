/*
 * XPath.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2016 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

var cSequence = require('./../classes/Sequence');

var cXSBoolean = require('./../types/schema/simple/atomic/XSBoolean');
//
var cXTItem = require('./../types/xpath/XTItem');
var cXTNode = require('./../types/xpath/XTNode');

var fStaticContext_defineSystemFunction = require('./../classes/StaticContext').defineSystemFunction;

/*
	9.1 Additional Boolean Constructor Functions
		true
		false

	9.3 Functions on Boolean Values
		not
*/

// 9.1 Additional Boolean Constructor Functions
// fn:true() as xs:boolean
fStaticContext_defineSystemFunction("true",	[],	function() {
	return new cXSBoolean(true);
});

// fn:false() as xs:boolean
fStaticContext_defineSystemFunction("false",	[],	function() {
	return new cXSBoolean(false);
});

// 9.3 Functions on Boolean Values
// fn:not($arg as item()*) as xs:boolean
fStaticContext_defineSystemFunction("not",	[[cXTItem, '*']],	function(oSequence1) {
	return new cXSBoolean(!cSequence.toEBV(oSequence1, this));
});

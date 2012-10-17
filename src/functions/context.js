/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

/*
	16 Context Functions
		position
		last
		current-dateTime
		current-date
		current-time
		implicit-timezone
		default-collation
		static-base-uri

*/
cFunctionCall.functions["position"]	= function() {
	return new cXPath2Sequence(this.position);
};

cFunctionCall.functions["last"]	= function() {
	return new cXPath2Sequence(this.last);
};
/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

function cXSDecimal(nValue) {
	this.value	= nValue;
};

cXSDecimal.RegExp	= /^[+\-]?((\d+(\.\d*)?)|(\.\d+))$/;

cXSDecimal.prototype	= new cXSAnyAtomicType;

cXSDecimal.prototype.value	= null;

cXSDecimal.prototype.valueOf	= function() {
	return this.value;
};

cXSDecimal.prototype.toString	= function() {
	return cString(this.value);
};

cXSDecimal.cast	= function(vValue) {
	var cType	= cXSAnyAtomicType.typeOf(vValue);
	switch (cType) {
		case cXSDecimal:
			return vValue;
		case cXSUntypedAtomic:
			vValue	= vValue.toString();
		case cXSString:
			var aMatch	= fString_trim.call(vValue).match(cXSDecimal.RegExp);
			if (aMatch)
				return new cXSDecimal(+vValue);
			throw new cXPath2Error("FORG0001");
		case cXSBoolean:
			return new cXSDecimal(vValue * 1);
		case cXSFloat:
		case cXSDouble:
		case cXSInteger:
			return new cXSDecimal(vValue.value);
	}
	throw new cXPath2Error("XPTY0004"
//->Debug
			, "Casting from " + cType + " to xs:decimal can never succeed"
//<-Debug
	);
};

//
fXPath2StaticContext_defineSystemDataType("decimal",	cXSDecimal);

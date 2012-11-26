/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

function cXSQName(sPrefix, sLocalName, sNameSpaceURI) {
	this.prefix	= sPrefix;
	this.localName	= sLocalName;
	this.namespaceURI	= sNameSpaceURI;
};

cXSQName.RegExp	= /^(?:(?![0-9-])([\w-]+)\:)?(?![0-9-])([\w-]+)$/;

cXSQName.prototype	= new cXSAnyAtomicType;

cXSQName.prototype.prefix	= null;
cXSQName.prototype.localName	= null;
cXSQName.prototype.namespaceURI	= null;

cXSQName.prototype.toString	= function() {
	return (this.prefix ? this.prefix + ':' : '') + this.localName;
};

cXSQName.cast	= function(vValue) {
	if (vValue instanceof cXSQName)
		return vValue;
	if (vValue instanceof cXSString || vValue instanceof cXSUntypedAtomic) {
		var aMatch	= fString_trim(vValue).match(cXSQName.RegExp);
		if (aMatch)
			return new cXSQName(aMatch[1] || null, aMatch[2], null);
		throw new cException("FORG0001");
	}
	//
	throw new cException("XPTY0004"
//->Debug
			, "Casting value '" + vValue + "' to xs:QName can never succeed"
//<-Debug
	);
};

//
fStaticContext_defineSystemDataType("QName",	cXSQName);

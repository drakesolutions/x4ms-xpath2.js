/*
 * XPath.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2016 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

var cException = require('./../classes/Exception');
var cStaticContext = require('./../classes/StaticContext');

// TODO: solve circular ref
//var cMultiplicativeExpr = require('./../expressions/arithmetic/MultiplicativeExpr');
//var cAdditiveExpr = require('./../expressions/arithmetic/AdditiveExpr');

var fStaticContext_defineSystemFunction = require('./../classes/StaticContext').defineSystemFunction;

var cXSAnyAtomicType = require('./../types/schema/simple/XSAnyAtomicType');
var cXSUntypedAtomic = require('./../types/schema/simple/atomic/XSUntypedAtomic');
var cXSDouble = require('./../types/schema/simple/atomic/XSDouble');
var cXSInteger = require('./../types/schema/simple/atomic/integer/XSInteger');
var cXSBoolean = require('./../types/schema/simple/atomic/XSBoolean');
var cXSString = require('./../types/schema/simple/atomic/XSString');
var cXSAnyURI = require('./../types/schema/simple/atomic/XSAnyURI');
//
var cXTItem = require('./../types/xpath/XTItem');
var cXTNode = require('./../types/xpath/XTNode');
var cXTElement = require('./../types/xpath/node/XTElement');
var cXTAttribute = require('./../types/xpath/node/XTAttribute');
var cXTText = require('./../types/xpath/node/XTText');
var cXTProcessingInstruction = require('./../types/xpath/node/XTProcessingInstruction');
var cXTComment = require('./../types/xpath/node/XTComment');
var cXTDocument = require('./../types/xpath/node/XTDocument');

var fIsNaN = global.isNaN;
var cMath = global.Math;

var cString = global.String;
var fString_trim = function (sValue) {
	return cString(sValue).trim();
};
var fArray_indexOf = function(aValue, oSubject) {
    return aValue.indexOf(oSubject);
};

/*
	15.1 General Functions and Operators on Sequences
		boolean
		index-of
		empty
		exists
		distinct-values
		insert-before
		remove
		reverse
		subsequence
		unordered

	15.2 Functions That Test the Cardinality of Sequences
		zero-or-one
		one-or-more
		exactly-one

	15.3 Equals, Union, Intersection and Except
		deep-equal

	15.4 Aggregate Functions
		count
		avg
		max
		min
		sum

	15.5 Functions and Operators that Generate Sequences
		id
		idref
		doc
		doc-available
		collection
		element-with-id

*/

// 15.1 General Functions and Operators on Sequences
// fn:boolean($arg as item()*) as xs:boolean
fStaticContext_defineSystemFunction("boolean",	[[cXTItem, '*']],	function(oSequence1) {
	return new cXSBoolean(fFunction_sequence_toEBV(oSequence1, this));
});

// fn:index-of($seqParam as xs:anyAtomicType*, $srchParam as xs:anyAtomicType) as xs:integer*
// fn:index-of($seqParam as xs:anyAtomicType*, $srchParam as xs:anyAtomicType, $collation as xs:string) as xs:integer*
fStaticContext_defineSystemFunction("index-of",	[[cXSAnyAtomicType, '*'], [cXSAnyAtomicType], [cXSString, '', true]],	function(oSequence1, oSearch, oCollation) {
	if (!oSequence1.length || oSearch == null)
		return [];

	// TODO: Implement collation

	var vLeft	= oSearch;
	// Cast to XSString if Untyped
	if (vLeft instanceof cXSUntypedAtomic)
		vLeft	= cXSString.cast(vLeft);

	var oSequence	= [];
	for (var nIndex = 0, nLength = oSequence1.length, vRight; nIndex < nLength; nIndex++) {
		vRight	= oSequence1[nIndex];
		// Cast to XSString if Untyped
		if (vRight instanceof cXSUntypedAtomic)
			vRight	= cXSString.cast(vRight);
		//
		if (vRight.valueOf() === vLeft.valueOf())
			oSequence.push(new cXSInteger(nIndex + 1));
	}

	return oSequence;
});

// fn:empty($arg as item()*) as xs:boolean
fStaticContext_defineSystemFunction("empty",	[[cXTItem, '*']],	function(oSequence1) {
	return new cXSBoolean(!oSequence1.length);
});

// fn:exists($arg as item()*) as xs:boolean
fStaticContext_defineSystemFunction("exists",	[[cXTItem, '*']],	function(oSequence1) {
	return new cXSBoolean(!!oSequence1.length);
});

// fn:distinct-values($arg as xs:anyAtomicType*) as xs:anyAtomicType*
// fn:distinct-values($arg as xs:anyAtomicType*, $collation as xs:string) as xs:anyAtomicType*
fStaticContext_defineSystemFunction("distinct-values",	[[cXSAnyAtomicType, '*'], [cXSString, '', true]],	function(oSequence1, oCollation) {
	if (arguments.length > 1)
		throw "Collation parameter in function '" + "distinct-values" + "' is not implemented";

	if (!oSequence1.length)
		return null;

	var oSequence	= [];
	for (var nIndex = 0, nLength = oSequence1.length, vLeft; nIndex < nLength; nIndex++) {
		vLeft	= oSequence1[nIndex];
		// Cast to XSString if Untyped
		if (vLeft instanceof cXSUntypedAtomic)
			vLeft	= cXSString.cast(vLeft);
		for (var nRightIndex = 0, nRightLength = oSequence.length, vRight, bFound = false; (nRightIndex < nRightLength) &&!bFound; nRightIndex++) {
			vRight	= oSequence[nRightIndex];
			// Cast to XSString if Untyped
			if (vRight instanceof cXSUntypedAtomic)
				vRight	= cXSString.cast(vRight);
			//
			if (vRight.valueOf() === vLeft.valueOf())
				bFound	= true;
		}
		if (!bFound)
			oSequence.push(oSequence1[nIndex]);
	}

	return oSequence;
});

// fn:insert-before($target as item()*, $position as xs:integer, $inserts as item()*) as item()*
fStaticContext_defineSystemFunction("insert-before",	[[cXTItem, '*'], [cXSInteger], [cXTItem, '*']],	function(oSequence1, oPosition, oSequence3) {
	if (!oSequence1.length)
		return oSequence3;
	if (!oSequence3.length)
		return oSequence1;

	var nLength 	= oSequence1.length,
		nPosition	= oPosition.valueOf();
	if (nPosition < 1)
		nPosition	= 1;
	else
	if (nPosition > nLength)
		nPosition	= nLength + 1;

	var oSequence	=  [];
	for (var nIndex = 0; nIndex < nLength; nIndex++) {
		if (nPosition == nIndex + 1)
			oSequence	= oSequence.concat(oSequence3);
		oSequence.push(oSequence1[nIndex]);
	}
	if (nPosition == nIndex + 1)
		oSequence	= oSequence.concat(oSequence3);

	return oSequence;
});

// fn:remove($target as item()*, $position as xs:integer) as item()*
fStaticContext_defineSystemFunction("remove",	[[cXTItem, '*'], [cXSInteger]],	function(oSequence1, oPosition) {
	if (!oSequence1.length)
		return [];

	var nLength 	= oSequence1.length,
		nPosition	= oPosition.valueOf();

	if (nPosition < 1 || nPosition > nLength)
		return oSequence1;

	var oSequence	=  [];
	for (var nIndex = 0; nIndex < nLength; nIndex++)
		if (nPosition != nIndex + 1)
			oSequence.push(oSequence1[nIndex]);

	return oSequence;
});

// fn:reverse($arg as item()*) as item()*
fStaticContext_defineSystemFunction("reverse",	[[cXTItem, '*']],	function(oSequence1) {
	oSequence1.reverse();

	return oSequence1;
});

// fn:subsequence($sourceSeq as item()*, $startingLoc as xs:double) as item()*
// fn:subsequence($sourceSeq as item()*, $startingLoc as xs:double, $length as xs:double) as item()*
fStaticContext_defineSystemFunction("subsequence",	[[cXTItem, '*'], [cXSDouble, ''], [cXSDouble, '', true]],	function(oSequence1, oStart, oLength) {
	var nPosition	= cMath.round(oStart),
		nLength		= arguments.length > 2 ? cMath.round(oLength) : oSequence1.length - nPosition + 1;

	// TODO: Handle out-of-range position and length values
	return oSequence1.slice(nPosition - 1, nPosition - 1 + nLength);
});

// fn:unordered($sourceSeq as item()*) as item()*
fStaticContext_defineSystemFunction("unordered",	[[cXTItem, '*']],	function(oSequence1) {
	return oSequence1;
});


// 15.2 Functions That Test the Cardinality of Sequences
// fn:zero-or-one($arg as item()*) as item()?
fStaticContext_defineSystemFunction("zero-or-one",	[[cXTItem, '*']],	function(oSequence1) {
	if (oSequence1.length > 1)
		throw new cException("FORG0003");

	return oSequence1;
});

// fn:one-or-more($arg as item()*) as item()+
fStaticContext_defineSystemFunction("one-or-more",	[[cXTItem, '*']],	function(oSequence1) {
	if (!oSequence1.length)
		throw new cException("FORG0004");

	return oSequence1;
});

// fn:exactly-one($arg as item()*) as item()
fStaticContext_defineSystemFunction("exactly-one",	[[cXTItem, '*']],	function(oSequence1) {
	if (oSequence1.length != 1)
		throw new cException("FORG0005");

	return oSequence1;
});


// 15.3 Equals, Union, Intersection and Except
// fn:deep-equal($parameter1 as item()*, $parameter2 as item()*) as xs:boolean
// fn:deep-equal($parameter1 as item()*, $parameter2 as item()*, $collation as string) as xs:boolean
fStaticContext_defineSystemFunction("deep-equal",	[[cXTItem, '*'], [cXTItem, '*'], [cXSString, '', true]],	function(oSequence1, oSequence2, oCollation) {
	throw "Function '" + "deep-equal" + "' not implemented";
});


// 15.4 Aggregate Functions
// fn:count($arg as item()*) as xs:integer
fStaticContext_defineSystemFunction("count",	[[cXTItem, '*']],	function(oSequence1) {
	return new cXSInteger(oSequence1.length);
});

// fn:avg($arg as xs:anyAtomicType*) as xs:anyAtomicType?
fStaticContext_defineSystemFunction("avg",	[[cXSAnyAtomicType, '*']],	function(oSequence1) {
	if (!oSequence1.length)
		return null;

	//
	try {
		var vValue	= oSequence1[0];
		if (vValue instanceof cXSUntypedAtomic)
			vValue	= cXSDouble.cast(vValue);
		for (var nIndex = 1, nLength = oSequence1.length, vRight; nIndex < nLength; nIndex++) {
			vRight	= oSequence1[nIndex];
			if (vRight instanceof cXSUntypedAtomic)
				vRight	= cXSDouble.cast(vRight);
			vValue	= cAdditiveExpr.operators['+'](vValue, vRight, this);
		}
		return cMultiplicativeExpr.operators['div'](vValue, new cXSInteger(nLength), this);
	}
	catch (e) {
		// XPTY0004: Arithmetic operator is not defined for provided arguments
		throw e.code != "XPTY0004" ? e : new cException("FORG0006"
//->Debug
				, "Input to avg() contains a mix of types"
//<-Debug
		);
	}
});

// fn:max($arg as xs:anyAtomicType*) as xs:anyAtomicType?
// fn:max($arg as xs:anyAtomicType*, $collation as string) as xs:anyAtomicType?
fStaticContext_defineSystemFunction("max",	[[cXSAnyAtomicType, '*'], [cXSString, '', true]],	function(oSequence1, oCollation) {
	if (!oSequence1.length)
		return null;

	// TODO: Implement collation

	//
	try {
		var vValue	= oSequence1[0];
		if (vValue instanceof cXSUntypedAtomic)
			vValue	= cXSDouble.cast(vValue);
		for (var nIndex = 1, nLength = oSequence1.length, vRight; nIndex < nLength; nIndex++) {
			vRight	= oSequence1[nIndex];
			if (vRight instanceof cXSUntypedAtomic)
				vRight	= cXSDouble.cast(vRight);
			if (hComparisonExpr_ValueComp_operators['ge'](vRight, vValue, this).valueOf())
				vValue	= vRight;
		}
		return vValue;
	}
	catch (e) {
		// XPTY0004: Cannot compare {type1} with {type2}
		throw e.code != "XPTY0004" ? e : new cException("FORG0006"
//->Debug
				, "Input to max() contains a mix of not comparable values"
//<-Debug
		);
	}
});

// fn:min($arg as xs:anyAtomicType*) as xs:anyAtomicType?
// fn:min($arg as xs:anyAtomicType*, $collation as string) as xs:anyAtomicType?
fStaticContext_defineSystemFunction("min",	[[cXSAnyAtomicType, '*'], [cXSString, '', true]],	function(oSequence1, oCollation) {
	if (!oSequence1.length)
		return null;

	// TODO: Implement collation

	//
	try {
		var vValue	= oSequence1[0];
		if (vValue instanceof cXSUntypedAtomic)
			vValue	= cXSDouble.cast(vValue);
		for (var nIndex = 1, nLength = oSequence1.length, vRight; nIndex < nLength; nIndex++) {
			vRight	= oSequence1[nIndex];
			if (vRight instanceof cXSUntypedAtomic)
				vRight	= cXSDouble.cast(vRight);
			if (hComparisonExpr_ValueComp_operators['le'](vRight, vValue, this).valueOf())
				vValue	= vRight;
			}
		return vValue;
	}
	catch (e) {
		// Cannot compare {type1} with {type2}
		throw e.code != "XPTY0004" ? e : new cException("FORG0006"
//->Debug
				, "Input to min() contains a mix of not comparable values"
//<-Debug
		);
	}
});

// fn:sum($arg as xs:anyAtomicType*) as xs:anyAtomicType
// fn:sum($arg as xs:anyAtomicType*, $zero as xs:anyAtomicType?) as xs:anyAtomicType?
fStaticContext_defineSystemFunction("sum",	[[cXSAnyAtomicType, '*'], [cXSAnyAtomicType, '?', true]],	function(oSequence1, oZero) {
	if (!oSequence1.length) {
		if (arguments.length > 1)
			return oZero;
		else
			return new cXSDouble(0);

		return null;
	}

	// TODO: Implement collation

	//
	try {
		var vValue	= oSequence1[0];
		if (vValue instanceof cXSUntypedAtomic)
			vValue	= cXSDouble.cast(vValue);
		for (var nIndex = 1, nLength = oSequence1.length, vRight; nIndex < nLength; nIndex++) {
			vRight	= oSequence1[nIndex];
			if (vRight instanceof cXSUntypedAtomic)
				vRight	= cXSDouble.cast(vRight);
			vValue	= cAdditiveExpr.operators['+'](vValue, vRight, this);
		}
		return vValue;
	}
	catch (e) {
		// XPTY0004: Arithmetic operator is not defined for provided arguments
		throw e.code != "XPTY0004" ? e : new cException("FORG0006"
//->Debug
				, "Input to sum() contains a mix of types"
//<-Debug
		);
	}
});


// 15.5 Functions and Operators that Generate Sequences
// fn:id($arg as xs:string*) as element()*
// fn:id($arg as xs:string*, $node as node()) as element()*
fStaticContext_defineSystemFunction("id",	[[cXSString, '*'], [cXTNode, '', true]],	function(oSequence1, oNode) {
	if (arguments.length < 2) {
		if (!this.DOMAdapter.isNode(this.item))
			throw new cException("XPTY0004"
//->Debug
					, "id() function called when the context item is not a node"
//<-Debug
			);
		oNode	= this.item;
	}

	// Get root node and check if it is Document
	var oDocument	= cStaticContext.functions["root"].call(this, oNode);
	if (this.DOMAdapter.getProperty(oDocument, "nodeType") != 9)
		throw new cException("FODC0001");

	// Search for elements
	var oSequence	= [];
	for (var nIndex = 0; nIndex < oSequence1.length; nIndex++)
		for (var nRightIndex = 0, aValue = fString_trim(oSequence1[nIndex]).split(/\s+/), nRightLength = aValue.length; nRightIndex < nRightLength; nRightIndex++)
			if ((oNode = this.DOMAdapter.getElementById(oDocument, aValue[nRightIndex])) && fArray_indexOf(oSequence, oNode) ==-1)
				oSequence.push(oNode);
	//
	return fFunction_sequence_order(oSequence, this);
});

// fn:idref($arg as xs:string*) as node()*
// fn:idref($arg as xs:string*, $node as node()) as node()*
fStaticContext_defineSystemFunction("idref",	[[cXSString, '*'], [cXTNode, '', true]],	function(oSequence1, oNode) {
	throw "Function '" + "idref" + "' not implemented";
});

// fn:doc($uri as xs:string?) as document-node()?
fStaticContext_defineSystemFunction("doc",			[[cXSString, '?', true]],	function(oUri) {
	throw "Function '" + "doc" + "' not implemented";
});

// fn:doc-available($uri as xs:string?) as xs:boolean
fStaticContext_defineSystemFunction("doc-available",	[[cXSString, '?', true]],	function(oUri) {
	throw "Function '" + "doc-available" + "' not implemented";
});

// fn:collection() as node()*
// fn:collection($arg as xs:string?) as node()*
fStaticContext_defineSystemFunction("collection",	[[cXSString, '?', true]],	function(oUri) {
	throw "Function '" + "collection" + "' not implemented";
});

// fn:element-with-id($arg as xs:string*) as element()*
// fn:element-with-id($arg as xs:string*, $node as node()) as element()*
fStaticContext_defineSystemFunction("element-with-id",	[[cXSString, '*'], [cXTNode, '', true]],	function(oSequence1, oNode) {
	throw "Function '" + "element-with-id" + "' not implemented";
});

// EBV calculation
function fFunction_sequence_toEBV(oSequence1, oContext) {
	if (!oSequence1.length)
		return false;

	var oItem	= oSequence1[0];
	if (oContext.DOMAdapter.isNode(oItem))
		return true;

	if (oSequence1.length == 1) {
		if (oItem instanceof cXSBoolean)
			return oItem.value.valueOf();
		if (oItem instanceof cXSString)
			return !!oItem.valueOf().length;
		if (cXSAnyAtomicType.isNumeric(oItem))
			return !(fIsNaN(oItem.valueOf()) || oItem.valueOf() == 0);

		throw new cException("FORG0006"
//->Debug
				, "Effective boolean value is defined only for sequences containing booleans, strings, numbers, URIs, or nodes"
//<-Debug
		);
	}

	throw new cException("FORG0006"
//->Debug
			, "Effective boolean value is not defined for a sequence of two or more items"
//<-Debug
	);
};

function fFunction_sequence_atomize(oSequence1, oContext) {
	var oSequence	= [];
	for (var nIndex = 0, nLength = oSequence1.length, oItem, vItem; nIndex < nLength; nIndex++) {
		oItem	= oSequence1[nIndex];
		vItem	= null;
		// Untyped
		if (oItem == null)
			vItem	= null;
		// Node type
		else
		if (oContext.DOMAdapter.isNode(oItem)) {
			var fGetProperty	= oContext.DOMAdapter.getProperty;
			switch (fGetProperty(oItem, "nodeType")) {
				case 1:	// ELEMENT_NODE
					vItem	= new cXSUntypedAtomic(fGetProperty(oItem, "textContent"));
					break;
				case 2:	// ATTRIBUTE_NODE
					vItem	= new cXSUntypedAtomic(fGetProperty(oItem, "nodeValue"));   // was "value"
					break;
				case 3:	// TEXT_NODE
				case 4:	// CDATA_SECTION_NODE
				case 8:	// COMMENT_NODE
					vItem	= new cXSUntypedAtomic(fGetProperty(oItem, "data"));
					break;
				case 7:	// PROCESSING_INSTRUCTION_NODE
					vItem	= new cXSUntypedAtomic(fGetProperty(oItem, "data"));
					break;
				case 9:	// DOCUMENT_NODE
					var oNode	= fGetProperty(oItem, "documentElement");
					vItem	= new cXSUntypedAtomic(oNode ? fGetProperty(oNode, "textContent") : '');
					break;
			}
		}
		// Base types
		else
		if (oItem instanceof cXSAnyAtomicType)
			vItem	= oItem;

		//
		if (vItem != null)
			oSequence.push(vItem);
	}

	return oSequence;
};

// Orders items in sequence in document order
function fFunction_sequence_order(oSequence1, oContext) {
	return oSequence1.sort(function(oNode, oNode2) {
		var nPosition	= oContext.DOMAdapter.compareDocumentPosition(oNode, oNode2);
		return nPosition & 2 ? 1 : nPosition & 4 ?-1 : 0;
	});
};

function fFunction_sequence_assertSequenceItemType(oSequence, oContext, cItemType
//->Debug
		, sSource
//<-Debug
	) {
	//
	for (var nIndex = 0, nLength = oSequence.length, nNodeType, vItem; nIndex < nLength; nIndex++) {
		vItem	= oSequence[nIndex];
		// Node types
		if (cItemType == cXTNode || cItemType.prototype instanceof cXTNode) {
			// Check if is node
			if (!oContext.DOMAdapter.isNode(vItem))
				throw new cException("XPTY0004"
//->Debug
						, "Required item type of " + sSource + " is " + cItemType
//<-Debug
				);

			// Check node type
			if (cItemType != cXTNode) {
				nNodeType	= oContext.DOMAdapter.getProperty(vItem, "nodeType");
				if ([null, cXTElement, cXTAttribute, cXTText, cXTText, null, null, cXTProcessingInstruction, cXTComment, cXTDocument, null, null, null][nNodeType] != cItemType)
					throw new cException("XPTY0004"
//->Debug
							, "Required item type of " + sSource + " is " + cItemType
//<-Debug
					);
			}
		}
		else
		// Atomic types
		if (cItemType == cXSAnyAtomicType || cItemType.prototype instanceof cXSAnyAtomicType) {
			// Atomize item
			vItem	= fFunction_sequence_atomize([vItem], oContext)[0];
			// Convert type if necessary
			if (cItemType != cXSAnyAtomicType) {
				// Cast item to expected type if it's type is xs:untypedAtomic
				if (vItem instanceof cXSUntypedAtomic)
					vItem	= cItemType.cast(vItem);
				// Cast item to xs:string if it's type is xs:anyURI
				else
				if (cItemType == cXSString/* || cItemType.prototype instanceof cXSString*/) {
					if (vItem instanceof cXSAnyURI)
						vItem	= cXSString.cast(vItem);
				}
				else
				if (cItemType == cXSDouble/* || cItemType.prototype instanceof cXSDouble*/) {
					if (cXSAnyAtomicType.isNumeric(vItem))
						vItem	= cItemType.cast(vItem);
				}
			}
			// Check type
			if (!(vItem instanceof cItemType))
				throw new cException("XPTY0004"
//->Debug
						, "Required item type of " + sSource + " is " + cItemType
//<-Debug
				);
			// Write value back to sequence
			oSequence[nIndex]	= vItem;
		}
	}
};

function fFunction_sequence_assertSequenceCardinality(oSequence, oContext, sCardinality
//->Debug
		, sSource
//<-Debug
	) {
	var nLength	= oSequence.length;
	// Check cardinality
	if (sCardinality == '?') {	// =0 or 1
		if (nLength > 1)
			throw new cException("XPTY0004"
//->Debug
					, "Required cardinality of " + sSource + " is one or zero"
//<-Debug
			);
	}
	else
	if (sCardinality == '+') {	// =1+
		if (nLength < 1)
			throw new cException("XPTY0004"
//->Debug
					, "Required cardinality of " + sSource + " is one or more"
//<-Debug
			);
	}
	else
	if (sCardinality != '*') {	// =1 ('*' =0+)
		if (nLength != 1)
			throw new cException("XPTY0004"
//->Debug
					, "Required cardinality of " + sSource + " is exactly one"
//<-Debug
			);
	}
};

module.exports = {
    assertSequenceCardinality: fFunction_sequence_assertSequenceCardinality,
    assertSequenceItemType: fFunction_sequence_assertSequenceItemType,
    atomize: fFunction_sequence_atomize,
    order: fFunction_sequence_order,
    toEBV: fFunction_sequence_toEBV
};
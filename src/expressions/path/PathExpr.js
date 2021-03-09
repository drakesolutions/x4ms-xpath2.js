/*
 * XPath.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2016 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

var cException = require('./../../classes/Exception');

var fFunction_sequence_order = require('./../../functions/sequence').order;

var fArray_indexOf = function(aValue, oSubject) {
    return aValue.indexOf(oSubject);
};

function cPathExpr() {
	this.items	= [];
};

cPathExpr.prototype.items	= null;

// Public members
cPathExpr.prototype.evaluate	= function (oContext) {
	var vContextItem	= oContext.item;
	//
	var oSequence	= [vContextItem];
	for (var nItemIndex = 0, nItemLength = this.items.length, oSequence1; nItemIndex < nItemLength; nItemIndex++) {
		oSequence1	= [];
		for (var nIndex = 0, nLength = oSequence.length; nIndex < nLength; nIndex++) {
			// Set new context item
			oContext.item	= oSequence[nIndex];
			//
			for (var nRightIndex = 0, oSequence2 = this.items[nItemIndex].evaluate(oContext), nRightLength = oSequence2.length; nRightIndex < nRightLength; nRightIndex++)
				if ((nItemIndex < nItemLength - 1) && !oContext.DOMAdapter.isNode(oSequence2[nRightIndex]))
					throw new cException("XPTY0019");
				else
				if (fArray_indexOf(oSequence1, oSequence2[nRightIndex]) ==-1)
					oSequence1.push(oSequence2[nRightIndex]);
		}
		oSequence	= oSequence1;
	};
	// Restore context item
	oContext.item	= vContextItem;
	//
	return fFunction_sequence_order(oSequence, oContext);
};

//
module.exports = cPathExpr;

var safe = require('safe-regex');
module.exports = function(context) {
    "use strict";
    return {
        "Literal": function(node) {
            var token = context.getTokens(node)[0],
                nodeType = token.type,
                nodeValue = token.value;

            if (nodeType === "RegularExpression") {
                if (!safe(nodeValue)) {
                    context.report(node, "Possible Unsafe Regular Expression:" + nodeValue);
                }
            }
        }
    };

};
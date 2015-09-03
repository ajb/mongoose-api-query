/**
*   convert a string in a bool value. 
*   @param {String} str given string for check
*   @return returns true if the value is true or positive
*   @TODO schould a positive value like t or y or yes really check?
*/
var convertToBoolean = function(str, strict) {
    "use strict";
    return strict ? str === 'true' : (["true", "t", "yes", "y"].indexOf(String(str).toLowerCase()) !== -1);
};


var isObject= function(o) {
    return o !== null && typeof o === 'object' && !isArray(o);
};

var flatten = function(arr) {
    if (Array.isArray(arr)) {
        return arr.reduce(function(prev, current){
            return prev.concat(current);
        }, []);
    }
    return arr;
};

module.exports = exports = {};
module.exports.convertToBoolean = convertToBoolean;
module.exports.isObject = isObject;
module.exports.flatten = flatten;

/**
* extends an object by another
* @param {Object} dest - destination object, that will be returned
* @param {Object} source - source object, that will override destination parameter
* @return {Object} the overridden destination object
*/
function extendObject(dest, source) {
    for (var prop in source) {
        if (!source.hasOwnProperty(prop)) {
            continue;
        }
        if (isObject(source[prop])) {
            dest[prop]= dest[prop] || (Array.isArray(source[prop]) ? [] : {});
            extendObject(dest[prop], source[prop]);
        } else {
            dest[prop]= source[prop];
        }
    }
    return dest;
}


/**
* extends an object with all objects in the arguments
* @return {Object} - first object in arguments overridden by the other objects
*/
var extend = function() {
    var master= arguments[0];
    for (var i= 1, l=arguments.length; i < l; i++) {
        master= extendObject(master, arguments[i]);
    }
    return master;
};


/**
*   convert a string in a bool value. 
*   @param {String} str given string for check
*   @return returns true if the value is true or positive
*   @TODO schould a positive value like t or y or yes really check?
*/
var convertToBoolean = function(str, strict) {
    "use strict";
    return strict ? str === 'true' || str===1 : (['1', "true", "t", "yes", "y"].indexOf(String(str).toLowerCase()) !== -1);
};


var isObject= function(o) {
    return o !== null && typeof o === 'object' && !Array.isArray(o);
};

/**
*
*/
var isFunction = function(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
};


/**
*
*/
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
module.exports.isFunction = isFunction;
module.exports.flatten = flatten;
module.exports.extend = extend;

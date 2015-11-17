var helper = require('./helper');
var extend = helper.extend;
var isFunction = helper.isFunction;

/**
* escape regex parameters
* @param {String} string - string that schould excaped
* @return {String} a save string to build an regex
*/
var escapeRegExp = function(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


/**
* make a query case sensitive
* @param {String} identifer - method for creating the compare function
* @param {Array|String} value - compare strings
* @return {RegExp|any} - return a case sensitive regexp or the value
*/
var caseSensitive = function(identifer, value) {
    if (Array.isArray(value)) {
        return value.map(function(value) {
            return caseSensitive(identifer, value);
        });
    }
    if (identifer !== 'exact' && value.constructor === String) {
        return new RegExp([escapeRegExp(value)].join(''), 'i');
    }
    return value;
};


/**
*   function to get items set in a Array.prototype.filter function
*/
var isSetFilter= function(item) {
    if (item && !Number.isNaN(item)) {
        return item;
    }
};


/**
* This is a compare function, that allowes us to specify a converter,
* with an specified identifer. All compares are compares with expression
* @param {String} identifer 
* @param {String} mapped - is the name for the query object, if null it will automaticly the identifer name
* @return {Function} a function which build the compare expression
*/
var compareExpression = function(identifer, mapped) {
    if (!mapped) {
        mapped = identifer;
    }
    /**
    * the compare function, that will be returned 
    * @param {Array|String|Number} - a value that has to be compared
    * @return {Array|Object|undefined} - the filter for mongoose find. If it is an array, the QueryBuilder will concat them, otherwise push to parameter list
    */
    var cmp = function(value, callback) {
        if (Array.isArray(value)) {
            if (identifer==='exact') {
                value = value.join(',');
                // $eq -> error
                return callback(null, value);
            } else {
                return value.forEach(function(value) {
                    cmp(value, callback);
                });
            }
        }
        if (!value) {
            return;
        }
        value = caseSensitive(identifer, value);
        var filter;
        if (identifer!=='eq') {
            callback('$' + mapped, value instanceof RegExp ? {$regex : value} : value);
        } else {
            callback(value instanceof RegExp ? '$regex' : null, value);
        }
    };
    return cmp;
};


/**
* This is a special compare function for $ne/$not.
* @param {String} identifer 
* @return {Function} a function which build the compare expression
*/
var compareNot = function(identifer) {
    /**
    * the compare function, that will be returned 
    * @param {Array|String|Number} - a value that has to be compared
    * @return {Array|Object|undefined} - the filter for mongoose find. If it is an array, the QueryBuilder will concat them, otherwise push to parameter list
    */
    var cmp = function(value, callback) {
        if (Array.isArray(value)) {
            return value.forEach(function(value) {
                cmp(value, callback);
            });
        }
        if (!value) {
            return;
        }
        value = caseSensitive(identifer, value);
        if (value.constructor===Number) {
            callback('$ne', value);
        } else {
            callback('$not', value);
        }
    };
    return cmp;
};


/**
* This is a compare function, that allowes us to specify a converter,
* with an specified identifer. All compares are compares with expression
* @param {String} identifer 
* @return {Function} a function which build the compare expression
*/
var compareValue = function(identifer, mapped) {
    if (!mapped) {
        mapped = identifer;
    }
    /**
    * the compare function, that will be returned 
    * @param {Array|String|Number} - a value that has to be compared
    * @return {Array|Object|undefined} - the filter for mongoose find. If it is an array, the QueryBuilder will concat them, otherwise push to parameter list
    */
    var cmp = function(value, callback) {
        if (!value) {
            return;
        }
        if (Array.isArray(value))  {
            value = caseSensitive(identifer, value).filter(isSetFilter);
            callback('$' + mapped, value);
            return;
        }
        value = caseSensitive(identifer, value);
        callback('$' + mapped, [value]);
    };
    return cmp;
};


/**
* create the special near parameter for mongoose find operations
* @param {Array} value - array of numbers, that will be used to check
* @return {Object} - find filter for $near
*/
var near = function(value, callback) {
    // mapping each parameter
    if (!Array.isArray(value) || isNaN(value[0]) || isNaN(value[1])) {
        return;
    }
    if (value[2] && !isNaN(value[2])) {
        // @todo make miles optional -> allow more 
        value[2]/= 69;
        callback(null, { 
            '$near': [Number(value[0]), Number(value[1])], 
            '$maxDistance': Number(value[2])
        });
        return;
    } 
    callback('$near', [Number(value[0]), Number(value[1])]);
};


/**
* create a mod filter for mongoose query
* @param {Array} value - array of numbers
*/
var modular = function(value, callback) {
    // mapping each parameter
    if (!Array.isArray(value) || isNaN(value[0]) || isNaN(value[1])) {
        return;
    }
    callback('$mod', [value[0], value[1]]);
};


var methods = {
    'lte': compareExpression('lte'),
    'lt' : compareExpression('lt'),
    'gte': compareExpression('gte'),
    'gt' : compareExpression('gt'),
    'ne' : compareNot('ne'),
    'in' : compareValue('in'),
    'nin': compareValue('nin'),
    'near': near,
    'all': compareValue('all'),
    'not': compareExpression('not'),
    'exact':compareExpression('exact'),
    'eq': compareExpression('eq'),
    'mod': modular,
};

var useMethod = function(method, value, callback) {
    if (methods[method] && isFunction(methods[method])) {
        return methods[method].call(null, value, callback);
    }
};

module.exports= useMethod;
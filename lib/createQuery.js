var helper = require('./helper');
var isFunction = helper.isFunction;
var isObject = helper.isObject;
var parseCommand = require('./parseCommand');
var queryBuilder = require('./QueryBuilder');
var ObjectId = require('bson').ObjectID;




/**
*
*/
var convertBoolean = function(possibles, value) {
    if (Array.isArray(possibles)) {
        return possibles.indexOf(value) !== -1;
    } else {
        return possibles == value;
    }
};


/**
*
*/
var valueFormatter = function(types) {
    /**
    *
    */
    var formatValue = function(type, value) {
        if (Array.isArray(value)) {
            return value.map(function(value) {
                return formatValue(type, value);
            });
        }
        if (type === 'ObjectId' && isFunction(types.ObjectId)) {
            return new ObjectId(value);
        }
        if (global[type] && isFunction(global[type])) {
            return global[type](value);
        }
        return value;
    };

    return formatValue;
};


/**
* create a single query statement for a given filter, with given objects
* @param {Object} options - 
* @param {Object} filter - 
*/
function createQuery(options, filter) {
    var Types = options.Types || {};
    filter= filter || {};
    var formatValue = valueFormatter(Types);

    /**
    * this method allowes us to create an and parameter
    * @param {String} name - operator name
    * @param {Array} setArray - 
    * @return {Array} reference for and operator
    */
    var __Operator = function(name, setArray) {
        if (!filter['$' + name]) {
            filter['$' + name]= Array.isArray(setArray) ? setArray : [];
        }
        return filter['$' + name];
    };


    /**
    * return the actual filter object
    * @return {Object} filter object
    */
    var getFilter = function() {
        return filter;
    };


    /**
    * set a filter for a query, by naming name and operator
    * @param {String} name -
    * @param {String|Array} operator - one operator as string or many as an array of strings
    * @param {any|Array} value - 
    */
    var setFilter = function(name, operator, value) {
        var valueArray = Array.prototype.slice.call(arguments);
        /**
        *
        */
        var __couldPlace = function(filter) {
            //operator.map
            if (Array.isArray(operator)) {
                var setAble = true;
                operator.forEach(function(operator) {
                    if (filter[operator]) {
                        setAble =false;
                    }
                });
                return setAble;
            }
            return !filter[operator];
        };
        /**
        * Set a operator with a given filter object.
        * If a filter could be set, it will return true, otherwise false
        * @param {Object} filter - filter object
        * @return {Boolean} true, if a filter could be set
        */
        var __setOperator = function(filter) {
            if (!filter[name]) {
                filter[name] = {};
            }
            if (!isObject(filter[name])) {
                return false;
            }
            if (Array.isArray(operator)) {
                if (__couldPlace(filter)) {
                    operator.forEach(function(operator, index) {
                        filter[name][operator] = valueArray[index+2];
                    });
                    return true;
                }
                return false;
            }
            if (!filter[name][operator]) {
                filter[name][operator] = value;
                return true;
            }
            return false;
        };
        // for referencing
        var andOperator;
        var _Ftmp;
        if (!operator) {
            // direkt input without operator
            if (filter[name]) {
                andOperator = __Operator('and');
                andOperator.push({ name: value });
            } else {
                filter[name] = value;
            }
            return;
        }
        if (__setOperator(filter)) {
            return;
        }
        andOperator = __Operator('and');
        for (var i= 0, len= andOperator.length; i<len; i++) {
            _Ftmp = andOperator[i];
            if (__setOperator(_Ftmp)) {
                return;
            }
        }
        _Ftmp = {};
        __setOperator(_Ftmp);
        andOperator.push(_Ftmp);
    };


    /**
    * @param {String} name -
    * @param {String} type - 
    * @param {Any} value -
    */
    var setParameter = function(name, type, value) {
        // set multiple parameter
        if (Array.isArray(value)) {
            value = value.map(function(value) {
                var query = createQuery(options);
                query.setParameter(name, type, value);
                return query.getFilter();
            }).filter(function(value) {
                return value;
            });
            var and = __Operator('and');
            __Operator('and',and.concat(value));
        } else {
            __setParameter(name, type, value);
        }
    };


    /**
    * @param {String} name -
    * @param {String} type - 
    * @param {Any} value -
    */
    var __setParameter = function(name, type, value) {
        if (!value) {
            return;
        }
        var callbackFunction = function() {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(name);
            setFilter.apply(null, args);
        };
        /**
        * create a single statement
        */
        var __createSingleStatement = function() {
            value = formatValue(type, value.split(',')).filter(function(value) {
                return value;
            });
            if (!value.length) {
                return;
            }
            if (value.length === 1) {
                queryBuilder('eq', value[0], callbackFunction);
                return;
            }
            var command = options.combineValues || 'in';
            queryBuilder(command, value, callbackFunction);
        };
        /**
        * create statements by commands
        * @param {Array} commandArray - list of commands
        * @param {Array} valueArray - list of values
        */
        var __createCommandStatement = function(commandArray, valueArray) {
            var filter = [];
            commandArray.forEach(function(command, index) {
                // filter[cmd] = value[index];
                // how to handle multiples
                var value = formatValue(type, valueArray[index].split(','));
                queryBuilder(command, value, callbackFunction);
            });
        };
        // boolean
        if (type === 'Boolean') {
            return setFilter(name, null, convertBoolean(options.booleanAsTrue, value));
        }
        // parse and test against commands
        var parseData   = parseCommand(value);
        var valueArray  = parseData.values;
        var commandArray= parseData.cmd;
        if (!commandArray.length) {
            return __createSingleStatement();
        }
        if (commandArray.length) {
            valueArray.shift();
        }
        return __createCommandStatement(commandArray, valueArray);
    };


    return {
        setParameter: setParameter,
        getFilter: getFilter,
    };
}

module.exports = exports = createQuery;
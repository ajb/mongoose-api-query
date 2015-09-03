/**
*   
*/

var parseSchemaKey = require('./parseSchemaKey');
var parseCommand = require('./parseCommand');
var createQuery = require('./createQuery');
var helper = require('./helper');




/**
*
*/
var SearchParams = function() {
    if (this instanceof SearchParams) {
        return new SearchParams();
    }
    this.store = {};
};

/**
*
*/
SearchParams.prototype.add = function(key, value) {
    "use strict";

    if (!this.store || !this.store[key]) {
        this.store[key]= value;
        return;
    }

    for (var keyName in value) {
        if (value.hasOwnProperty(keyName) === false) {
            continue;
        }
        this.store[key][i] = value[i];
    }
};


/**
*   create a handler for key value storage
*   @param {String} key - key name for the object, that schould be stored
*   @return {Function} - a value setter function
*/
SearchParams.prototype.set = function(key) {
    var self = this;
    return function(value) {

    };
};



/**
*   parsing a parameter object and convert them to a 
*/
var apiQueryParams = function(rawParams, options) {
    "use strict";

    var model = this;

    options = options || {};

    options.throwErrror = !!options.throwErrror || false;

    var sort    = false;
    var page    = 1;

    var perPage = options.page   || 10;
    var strict  = options.strict || false;


    var searchParams = {};
    var query;

    for (var keyName in rawParams) {
        if (rawParams.hasOwnProperty(keyName) === false) {
            continue;
        }

        var keyObject = parseSchemaKey(model.db, model.schema, keyName);
        //console.log(keyObject);
        if (!keyObject && options.throwErrror) {
            throw new Error('The key is not part of the scheme: ' + keyName);
        }
        if (!keyObject) {
            // key not found
            continue;
        }
        // store tree for ref operations
        var keyTree = keyObject;
        var hasRefer= false;
        while(keyObject.child) {
            if (keyObject.refer) {
                console.warn('References are not implemented yet.');
                hasRefer = true;
                if (options.throwErrror) {
                    throw new Error('The key is not part of the scheme: ' + keyName);
                }
            }
            keyObject = keyObject.child;
        }

        var keyType  = keyObject.type;
        var keyValue = rawParams[keyName];
        var queryGenerator = createQuery(options);

        if (!hasRefer) {
            queryGenerator.parse(keyName, keyType, keyValue);
        }

        //queryGenerator.parse('test', 'Number', '{lt}1');
        var util = require('util');
        console.log(util.inspect(queryGenerator.query(), {
            depth: null
        }));
    }


    return {
        searchParams:searchParams,
        page:page,
        perPage:perPage,
        sort:sort
    };
};


module.exports = exports = apiQueryParams;
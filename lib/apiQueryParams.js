/**
*   
*/
var parseSchemaKey = require('./parseSchemaKey');
var parseCommand = require('./parseCommand');
var createQuery = require('./createQuery');
var helper = require('./helper');

/**
* walk amoung the keyObject to check if there is a refer to an other object in the parsed data
* @param {Object} keyObject - an object, returned from parseSchemaKey
* @return {Boolean} true if there is a reference via 'ref'
*/
var hasRefer = function(keyObject) {
    keyObject = keyObject || {};
    while(keyObject.child) {
        if (keyObject.refer) {
            return true;
        }
        keyObject = keyObject.child;
    }
    return false;
};

/**
*
*/
var getType = function(keyObject) {
    keyObject = getLastKeyObject(keyObject);
    return keyObject.type || 'unknown';
};


/**
* 
*/
var getLastKeyObject = function(keyObject) {
    keyObject = keyObject || {};
    while(keyObject.child) {
        keyObject = keyObject.child;
    }
    return keyObject;
};


/**
*
*/
var filterSet = function(item) {
    return item;
};


/**
* parsing a parameter object and convert them to a 
* @todo refactor to remove complexity 
*/
var apiQueryParams = function(parameter, options) {
    "use strict";
    options   = options || {};
    var model = this;
    var query = {};
    var queryBuilder = createQuery(options, query);


    /**
    * 
    */
    var generateKeyQuery = function(name, value, keyObject) {
        var type = getType(keyObject);
        queryBuilder.setParameter(name, type, value);
    };


    /**
    * parses ervery key to setup the full query at the outer object query
    * @param {String} name - key name
    * @param {Array|any} value - value for this parameter
    */
    var parseKey = function(name, value) {
        var keyObject = parseSchemaKey(model.db, model.schema, name);
        if (!keyObject && options.throwErrror) {
            throw new Error('The key is not part of the scheme: ' + name);
        }
        if (!keyObject) {
            // key not found
            return;
        }
        if (hasRefer(keyObject)) {
            if (options.throwErrror) {
                throw new Error('The key is not part of the scheme: ' + keyName);
            }
        }
        // we got a key object and know, that it is not a refer to object
        generateKeyQuery(name, value, keyObject);
    };


    parameter = parameter || {};
    for (var keyName in parameter) {
        if (parameter.hasOwnProperty(keyName) === false) {
            continue;
        }
        parseKey(keyName, parameter[keyName]);
    }

    return queryBuilder.getFilter();
};


module.exports = exports = apiQueryParams;

/*
    var queryGenerator = createQuery(options);
    return queryGenerator.query();




    var checkKey = function(keyObject) {
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

        var keyType  = keyObject.type || 'unknown';

        return {
            hasRefer: hasRefer,
            keyType: keyType,
            keyTypeConstructor: options.Types[keyType] || null,
        };
    };

console.warn('References are not implemented yet.');
            hasRefer = true;
            if (options.throwErrror) {
                throw new Error('The key is not part of the scheme: ' + keyName);
            }

if (parameter.hasOwnProperty(keyName) === false) {
            continue;
        }
        var keyValue = parameter[keyName];
        
        if (!keyObject && options.throwErrror) {
            throw new Error('The key is not part of the scheme: ' + keyName);
        }
        if (!keyObject) {
            // key not found
            continue;
        }
        var keyData = checkKeyObject(options, keyObject);
        if (keyData.hasRefer !== true) {
            queryGenerator.parse(keyName, keyType, keyValue);
        }
        */
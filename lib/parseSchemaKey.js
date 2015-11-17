/**
* get the type name from the type object
* @param {Object} mongoose schema object
* @return {String} type name
*/
var getType= function(typeObject) {
    var type = typeObject.instance || typeObject.constructor.name;
    if (type.indexOf('Schema')===0 && type.length>6) {
        type = type.substr(6);
    }

    if (type==='ObjectID') {
        type = 'ObjectId';
    }
    return type;
};


/**
* find a specified key against a schema
* @param schema {mongoose.Schema} 
* @param {String} key - key for search
* @return {Object} 
*           @param {String} key - key part if it was found
*           @param {String} subKey - part if a subKey is identified
*/
var findKey = function(schema, key) {
    "use strict";
    var subKey;
    var keyName = key;
    // possible sub part
    if (!schema.paths[key] && key.indexOf('.')!==-1) {
        var keyArray= key.split('.');
        for (var i=1, len= keyArray.length; i<len; i++) {
            // first part
            keyName= keyArray.slice(0,-i).join('.');
            // last part
            if (schema.paths[keyName]) {
                subKey= keyArray.slice(-i).join('.');
                break;
            }
        }
    }
    return {
        key: keyName,
        subKey: subKey,
    };
};


/**
* search in a schema for a specified key
* @param {mongoose.Schema} schema - a schema specified with mongoose.Schema()
* @param {String} key 
* @return {Object|undefined}
* @todo refactor to reduce complexity 
*/
var parseSchemaKey= function(mongoose, schema, key) {
    "use strict";
    key = String(key || '');
    if (!schema || !schema.paths || !key) {
        return;
    }
    var tmp    = findKey(schema, key);
    var subKey = tmp.subKey;
    key        = tmp.key;

    // no key found
    if (!schema.paths[key]) {
        return;
    }
    var child;
    var typeObject= schema.paths[key];
    if (typeObject.schema && subKey) {
        // sub schema specified
        child = parseSchemaKey(mongoose, typeObject.schema, subKey);
        if (!child) {
            return;
        }
        return {
            key: key,
            type: 'Schema',
            child: child
        };
    } else if (typeObject.caster && 
        typeObject.caster.options && 
        typeObject.caster.options.ref) {
        /*
          new Schema({
            test: [{ type: ObjectId, ref:'other Schema'}]
          });
        */
        var refer = typeObject.caster.options.ref;
        try {
            var subSchema = mongoose.model(refer).schema;
            child = parseSchemaKey(mongoose, subSchema, subKey);
            if (!child) {
                return;
            }
            return {
                key: key,
                type: getType(typeObject),
                child: child,
                refer: true,
            };
        } catch(error)  {
            // could not find the referred model
            return;
        }
    } else if (typeObject.instance == 'Mixed') {
        return {
            key: [key, subKey].join('.'),
            type: 'unknown',
        };
    } else if (subKey) {
        return;
    }
    return {
        key: key,
        type: getType(typeObject),
    };
};


module.exports = exports = parseSchemaKey;
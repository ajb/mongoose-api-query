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
* search in a schema for a specified key
* @param {mongoose.Schema} schema - a schema specified with mongoose.Schema()
* @param {String} key 
* @return {Object|undefined} 
*/
var parseSchemaKey= function(mongoose, schema, key) {
    "use strict";
    key = String(key || '');
    if (!schema || !schema.paths || !key) {
        return;
    }
    var subKey;
    // possible sub part
    if (!schema.paths[key] && key.indexOf('.')!==-1) {
        var keyName;
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
        key= keyName;
    }
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
    } else if (subKey) {
        return;
    }

    return {
        key: key,
        type: getType(typeObject),
    };
};


module.exports = exports = parseSchemaKey;
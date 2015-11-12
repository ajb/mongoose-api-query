var apiQueryParams = require('./apiQueryParams');
var helper = require('./helper');
var isFunction= helper.isFunction;
var extend = helper.extend;
/**
*   Plugin for mongoose
*   @param {mongoose.Schema} schema - schema for a collection
*/
function apiQueryPlugin(schema, options) {
    "use strict";
    /**
    * dirty check if the module is used as a plugin
    */
    if (!schema || !schema.statics || !schema.constructor.Types) {
        throw new Error('No schema given.');
    }
    var schemaTypes = schema.constructor.Types;


    options = options || {};
    options.Types = schemaTypes;

    /**
    * 
    */
    options.throwErrror  = !!options.throwErrror || false;    
    /**
    *
    */
    options.combineParameter = 'and';
    options.combineValues = 'in';

    /**
    * if a 
    */
    options.booleanAsTrue = options.booleanAsTrue || ['1', 'true', 't', 'yes', 'y'] ;


    /**
    *   
    */
    options.mapKeys = {
        'per_page': '$limit',
        'page':     '$page',
        'sort_by':  '$sort',
    };

    /**
    *   extending the schema with the method apiQuery
    *   @param {Object} rawParams
    *   @param {Function} callback [Optional]
    *   @return {Function} query position
    */
    schema.statics.apiQuery = function(rawParams, callback) {
        // mapping keys
        var params = extend({}, rawParams);
        for (var key in options.mapKeys) {
            if (options.mapKeys.hasOwnProperty(key) === false)  {
                continue;
            }
            if (params[key]) {
                params[options.mapKeys[key]] = params[key];
                delete params[key];
            }
        }
        var model = this;
        var searchParams = apiQueryParams.call(model, params, options);

        var limit = function(model, meta) {
            var limit;
            meta = meta || {};
            if (params.$limit) {
                limit = Number(params.$limit);
                if (isNaN(limit) || limit <0) {
                    limit = 10;
                }
                model = model.limit(limit);
                meta.limit = limit;
            }
            return model;
        };

        var pages = function(model, meta) {
            meta = meta || {};
            var limit = meta.limit || 10;
            var maxPages = meta.maxPages = ~~(meta.count/limit)+1;
            var skip = Number(params.$page);
            if (isNaN(skip) || skip<1) {
                skip = 1;
            }
            if (skip>maxPages) {
                skip=maxPages;
            }
            meta.page = skip;
            skip = (skip-1)*limit;
            model = model.skip(skip);
            return model;
        };

        var sort = function(model) {
            if (params.$sort) {
                sort = params.$sort.split(',');
                if (!sort[1]) {
                    sort[1] = 1;
                }
                model = model.sort([sort]);
            }        
            return model;
        };

        var text = function(model) {
            if (params.$text) {
                return model.find({ $text: { $search: params.$text } });
            }
            if (!params.$like) {
                return model;
            }
            params.$like = params.$like.replace(/\s+/g,'|');
            var indexes = model.schema.indexes();
            var or = [];
            var search = new RegExp(params.$like, "i");
            indexes.forEach((key) => {
                key = key[0] || key;
                Object.keys(key).forEach((field) => {
                    var obj = {};
                    obj[field] = search;
                    or.push(obj);
                });
            });
            if (or.length) {
                model = model.find({ $or: or});
            }
            return model;
        };



        if (isFunction(callback)) {
            return model.count(searchParams, function(err, count) {
                var meta = {
                    count: count
                };
                model = model.find(searchParams);
                model = text(model);
                model = limit(model, meta);
                model = pages(model, meta);
                model = sort(model, meta);
                if (params.$populate) {
                    model = model.populate(params.$populate);
                }
                // @todo add meta data
                var cb = !params.$meta ? callback : function(err, data) {
                    if (err) {
                        return callback(err, data);
                    }
                    callback(err, data, meta);
                };
                model.exec(cb);
            });
        }

        return model.count(searchParams).then(function(count){ 
                var meta = {
                    count: count
                };
                model = model.find(searchParams);
                model = text(model);
                model = limit(model, meta);
                model = pages(model, meta);
                model = sort(model, meta);
                if (params.$populate) {
                    model = model.populate(params.$populate);
                }
                // @todo add meta data
                if (params.$meta) {
                    return model.then(function(data) {
                        return [data, meta];
                    });
                }
                return model;
        });
    };
}

module.exports = apiQueryPlugin;
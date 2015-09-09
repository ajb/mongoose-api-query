var apiQueryParams = require('./apiQueryParams');
var helper = require('./helper');
var isFunction= helper.isFunction;
var extend = helper.extend;
/**
*   Plugin for mongoose
*   @param {mongoose.Schema} schema - schema for a collection
*/
function apiQueryPlugin(schema, options) {
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
        searchParams = apiQueryParams.call(model, params, options);

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
            if (params.$page) {
                skip = Number(params.$page);
                if (isNaN(skip) || skip<1) {
                    skip = 1;
                }
                if (skip>maxPages) {
                    skip=maxPages;
                }
                meta.page = skip;
                skip = (skip-1)*limit;
                model = model.skip(skip);
            }
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

        if (isFunction(callback)) {
            return model.count(searchParams, function(err, count) {
                var meta = {
                    count: count
                };
                model = model.find(searchParams);
                model = limit(model, meta);
                model = pages(model, meta);
                model = sort(model, meta);
                if (params.$populate) {
                    model = model.populate(params.$populate);
                }
                // @todo add meta data
                model.exec(callback);
            });
        }

        return model.count(searchParams).then(function(count){ 
                var meta = {
                    count: count
                };
                model = model.find(searchParams);
                model = limit(model, meta);
                model = pages(model, meta);
                model = sort(model, meta);
                if (params.$populate) {
                    model = model.populate(params.$populate);
                }
                // @todo add meta data
                return model;
        });
    };
}

module.exports = apiQueryPlugin;
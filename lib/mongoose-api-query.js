var apiQueryParams = require('./apiQueryParams');

/**
*   Plugin for mongoose
*   @param {mongoose.Schema} schema - schema for a collection
*/
function apiQueryPlugin(schema) {

    if (!schema || !schema.statics) {
        throw new Error('No schema given.');
    }

    schema.statics.apiQuery = function(rawParams, callback) {
        var model = this;
        var params = apiQueryParams.call(model, rawParams);

        var query = model
            .find(params.searchParams)
            .limit(params.per_page)
            .skip((params.page - 1) * params.per_page);

        if (params.sort) {
            query = query.sort(params.sort);
        }

        if (callback) {
            return query.exec(callback);
        }

        return query;
    };
}

module.exports = exports = apiQueryPlugin;
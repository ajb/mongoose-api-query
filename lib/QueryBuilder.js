/**
*   function to get items set in a Array.prototype.filter function
*/
var isSetFilter= function(item) {
    return item;
};

/**
*   @param {String} identifer 
*   @return {Function} a function which build the compare expression
*/
var compareExpression = function(identifer) {
    /**
    *
    */
    var cmp = function(value) {
        if (Array.isArray(value)) {
            return value.map(cmp);
        }
        if (!value) {
            return;
        }
        var filter = {};
        filter['$' + identifer] = value;
        return filter;
    };
    return cmp;
};


/**
*  
*/
var compareValue = function(identifer) {

    var cmp = function(value) {
        var filter;
        if (Array.isArray(value))  {
            value = value.filter(isSetFilter);
            filter = {};
            filter['$' + identifer] = value;
            return filter;
        }
        if (!value) {
            return;
        }
        filter = {};
        filter['$' + identifer] = [value];
        return filter;
    };
    return cmp;
};

/**
*
*/
var near = function(value) {
    // mapping each parameter
    if (isNaN(value[0]) || isNaN(value[1])) {
        return;
    }
    var dist = { $near: [value[0], value[1]] };
    if (value[2] && !isNaN(value[2])) {
        // @todo make miles optional -> allow more 
        dist.$maxDistance = value[2] / 69;
    }
    return dist;
};


/**
*
*/
function QueryBuilder(options) {
    if (this instanceof QueryBuilder === false) {
        return new QueryBuilder(options);
    }
    this.options = options || {};
    this.combine = undefined===this.options.cmpAnd || this.options.cmpAnd ? 'and' : 'or';
    this.query = [];
    this.builder  =[];
}


/**
*
*/
QueryBuilder.prototype.add = function(method, key, value) {
    if (method instanceof QueryBuilder) {
        return this.addBuilder(method);
    }
    if (!this.hasMethod(method)) {
        return;
    }
    var filter = this.use(method,value);
    if (!filter) {
        return;
    }
    if (Array.isArray(filter)) {
        filter = filter.filter(isSetFilter).map(function(filter) {
            var result = {};
            result[key] = filter;
            return result;
        });
        this.query = this.query.concat(filter);
        return;
    }
    var result = {};
    result[key] = filter;
    this.query.push(result);
};


/**
*
*/
QueryBuilder.prototype.addBuilder = function(builder) {
    if (builder instanceof QueryBuilder) {
        this.builder.push(builder);
        return;
    }
};


/**
*
*/
QueryBuilder.prototype.build = function(buildMethod) {

    var builder = this.builder.map(function(subQuery) {
        return subQuery.build();
    }).filter(isSetFilter);

    var result = this.query.concat(builder).filter(isSetFilter);
    if (result.length) {
        var resultFilter = {};
        resultFilter['$' + this.combine] = result;
        return resultFilter;
    }
};


QueryBuilder.prototype.use = function(method, value) {
    if (this.hasMethod(method)) {
        return QueryBuilder.methods[method](value);
    }
};

/**
*
*/
QueryBuilder.prototype.hasMethod = function(method) {
    return !!QueryBuilder.methods[method];
};

QueryBuilder.methods = {
    'lte': compareExpression('lte'),
    'lt' : compareExpression('lt'),
    'gte': compareExpression('gte'),
    'gt' : compareExpression('gt'),
    'ne' : compareExpression('ne'),
    'in' : compareValue('in'),
    'nin': compareValue('nin'),
    'near': near,
};


module.exports = exports = QueryBuilder;
var helper = require('./helper');
var parseCommand = require('./parseCommand');
var QueryBuilder = require('./QueryBuilder');

var types = {
    'String': String,
    'Number': Number,
};


/**
* parse the specific type
*/
var formatValue = function(type, value) {
    if (Array.isArray(value)) {
        return value.map(function(value) {
            return formatValue(type, value);
        });
    }
    if (types[type]) {
        value = types[type](value || '');
    }
    return value;
};


/**
*
*/
function createQuery(options) {
    var queryBuilder = new QueryBuilder();
    options = options || {};

    var parseParameter = function(key, type, value) {
        if (Array.isArray(value)) {
            value= value.map(function(part) {
                return parseParameter(key, type, part);
            }).filter(isSetFilter);
            return;
        }
        if (type === 'Boolean') {
            queryBuilder.add('eq', key, helper.convertToBoolean(parameter, !!options.strict));
            return;
        }

        var parseData = parseCommand(value);
        var val = parseData.values;
        var cmd = parseData.cmd;
        if (cmd.length) {
            if (val[0]) {
                console.warn('Problem while parsing: Value found before the first operator. It will be removed.');
            }
            val.shift();
        }
        // single parameter
        if (!cmd.length) {
            value = formatValue(type, val[0].split(',')); 
            queryBuilder.add('eq', key, value);
            return;
        }
        // mapping commands
        var subQuery = new QueryBuilder({ cmpAnd: false });
        cmd.forEach(function(command, index) {
            var value = formatValue(type, val[index].split(','));
            if (!queryBuilder.hasMethod(command)) {
                if (options.throwError) {
                    throw new Error('Error while parsing: Command not found:' + command);
                }
                return;
            }
            subQuery.add(command, key, value);
        });
        queryBuilder.add(subQuery);
    };

    var query = function() {
        //console.log(queryBuilder);
        return queryBuilder.build();
    };

    return {
        parse: parseParameter,
        query: query
    };
}

module.exports = exports = createQuery;
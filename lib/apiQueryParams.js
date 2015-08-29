

/**
*   convert a string in a bool value. 
*   @param {String} str given string for check
*   @return returns true if the value is true or positive
*   @TODO schould a positive value like t or y or yes really check?
*/
var convertToBoolean = function(str, strict) {
    return strict ? str === 'true' : (["true", "t", "yes", "y"].indexOf(String(str).toLowerCase()) !== -1);
};

/**
*   
*/
var addSearchParam = function(searchParams, key, value) {
    if (!searchParams || !searchParams[key]) {
        searchParams[key]= value;
        return;
    }

    for (var i in value) {
        if (val)
        searchParams[key][i] = value[i];
    }
};


var apiQueryParams = function(rawParams, options) {
    "use strict";
    
    var model = this;

    options = options || {};

    var sort    = false;
    var page    = 1;

    var perPage = options.page;
    var strict  = options.strict || false;



    var searchParams = {};
    var query;



    // Construct searchParams
    for (var key in rawParams) {
        if (rawParams.hasOwnProperty(key) === false) {
            continue;
        }

        var separatedParams = rawParams[key].match(/^(\{\w+\})(.*)$/g);

        if (separatedParams === null) {
            parseParam(key, rawParams[key]);
        } else {
            for (var i = 0, len = separatedParams.length; i < len; ++i) {
                parseParam(key, separatedParams[i]);
            }
        }
    }


return {
    searchParams:searchParams,
    page:page,
    perPage:perPage,
    sort:sort
};



    var parseSchemaForKey = function (schema, keyPrefix, lcKey, val, operator) {

        var paramType = false;
        // addSearchParams() 
        // var key = keyPrefix + lcKey;

if (var matches = lcKey.match(/(.+)\.(.+)/)) {
    // parse subschema
    var pathKey = schema.paths[matches[1]];
    var constructorName = pathKey.constructor.name;

    if (["DocumentArray", "Mixed"].indeOf(constructorName) !== -1) {
      parseSchemaForKey(pathKey.schema, matches[1] + ".", matches[2], val, operator)
  }
} else if (typeof schema === "undefined") {
    paramType = "String";

} else if (typeof schema.paths[lcKey] === "undefined"){
    // nada, not found

} else if (operator === "near") {
    paramType = "Near";
} else {
    var constructorName = schema.paths[lcKey].constructor.name;
    var nameMatch = {
      "SchemaBoolean": "Boolean",
      "SchemaString": "String",
      "ObjectId": "ObjectId"
  };

  paramType = nameMatch[constructorName] || false
}

if (paramType === "Boolean") {
    addSearchParam(convertToBoolean(val));
} else if (paramType === "Number") {
    if (val.match(/([0-9]+,?)/) && val.match(',')) {
      if (operator === "all") {
        addSearchParam({$all: val.split(',')});
    } else if (operator === "nin") {
        addSearchParam({$nin: val.split(',')});
    } else if (operator === "mod") {
        addSearchParam({$mod: [val.split(',')[0], val.split(',')[1]]});
    } else {
        addSearchParam({$in: val.split(',')});
    }
} else if (val.match(/([0-9]+)/)) {
    if (["gt", "gte", "lt", "lte", "ne"].indexOf(operator) != -1) {
        var newParam = {};
        addSearchParam({
          "$" + operator: val
      });
    } else {
        addSearchParam(parseInt(val));
    }
}
} else if (paramType === "String") {
    if (val.match(',')) {
      var options = val.split(',').map(function(str){
        return new RegExp(str, 'i');
    });

      if (operator === "all") {
        addSearchParam({$all: options});
    } else if (operator === "nin") {
        addSearchParam({$nin: options});
    } else {
        addSearchParam({$in: options});
    }
} else if (val.match(/^[0-9]+$/)) {
    if (operator === "gt" ||
      operator === "gte" ||
      operator === "lt" ||
      operator === "lte") {
        var newParam = {};
    newParam["$" + operator] = val;
    addSearchParam(newParam);
} else {
    addSearchParam(val);
}
} else if (operator === "ne" || operator === "not") {
    var neregex = new RegExp(val,"i");
    addSearchParam({'$not': neregex});
} else if (operator === "exact") {
    addSearchParam(val);
} else {
    addSearchParam({$regex: val, $options: "-i"});
}
} else if (paramType === "Near") {
    // divide by 69 to convert miles to degrees
    var latlng = val.split(',');
    var distObj = {$near: [parseFloat(latlng[0]), parseFloat(latlng[1])]};
    if (typeof latlng[2] !== 'undefined') {
      distObj.$maxDistance = parseFloat(latlng[2]) / 69;
  }
  addSearchParam(distObj);
} else if (paramType === "ObjectId") {
    addSearchParam(val);
}

};

var parseParam = function (key, val) {
    var lcKey = key
    , operator = val.match(/\{(.*)\}/)
    , val = val.replace(/\{(.*)\}/, '');

    if (operator) operator = operator[1];

    if (val === "") {
        return;
    } else if (lcKey === "page") {
        page = val;
    } else if (lcKey === "per_page") {
        perPage = val;
    } else if (lcKey === "sort_by") {
        var parts = val.split(',');
        sort = {};
        sort[parts[0]] = parts.length > 1 ? parts[1] : 1;
    } else {
        parseSchemaForKey(model.schema, "", lcKey, val, operator);
    }
};


}

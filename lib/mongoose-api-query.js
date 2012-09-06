module.exports = exports = function apiQueryPlugin (schema) {

  schema.statics.apiQuery = function(rawParams, cb) {

    var convertToBoolean = function (str) {
      if (str.toLowerCase() === "true" ||
          str.toLowerCase() === "t" ||
          str.toLowerCase() === "yes" ||
          str.toLowerCase() === "y" ||
          str === "1"){
        return true;
      } else {
        return false;
      }
    };

    var searchParams = {}
      , query

    var parseSchemaForKey = function (schema, keyPrefix, lcKey, val, operator) {

      var addSearchParam = function (param) {
        for (var key in param) {
          searchParams[keyPrefix + key] = param[key];
        }
      };

      var param = {};

      if (matches = lcKey.match(/(.+)\.(.+)/)) {
        // parse subschema
        if (schema.paths[matches[1]].constructor.name === "DocumentArray") {
          parseSchemaForKey(schema.paths[matches[1]].schema, matches[1] + ".", matches[2], val, operator)
        }

      } else if (lcKey === "" || typeof schema.paths[lcKey] === "undefined"){
        // nada

      } else if (schema.paths[lcKey].constructor.name === "SchemaBoolean") {
        param[lcKey] = convertToBoolean(val);

      } else if (schema.paths[lcKey].constructor.name === "SchemaString") {

        if (val.match(',')) {
          var options = val.split(',').map(function(str){
            return new RegExp(str, 'i');
          });

          if (operator === "all") {
            param[lcKey] = {$all: options};
          } else if (operator === "nin") {
            param[lcKey] = {$nin: options};
          } else {
            param[lcKey] = {$in: options};
          }
        } else if (val.match(/([0-9]+)/)) {
          if (operator === "gt" ||
              operator === "gte" ||
              operator === "lt" ||
              operator === "lte") {
            param[lcKey] = {};
            param[lcKey]["$" + operator] = val;
          } else {
            param[lcKey] = val;
          }
        } else if (operator === "ne" || operator === "not") {
          var neregex = new RegExp(val,"i");
          param[lcKey] = {'$not': neregex};
        } else {
          param[lcKey] = {$regex: val, $options: "-i"};
        }


      } else if (schema.paths[lcKey].constructor.name === "SchemaNumber") {

        if (val.match(/([0-9]+,?)/) && val.match(',')) {
          if (operator === "all") {
            param[lcKey] = {$all: val.split(',')};
          } else if (operator === "nin") {
            param[lcKey] = {$nin: val.split(',')};
          } else {
            param[lcKey] = {$in: val.split(',')};
          }
        } else if (val.match(/([0-9]+)/)) {
          if (operator === "gt" ||
              operator === "gte" ||
              operator === "lt" ||
              operator === "lte" ||
              operator === "ne") {
            param[lcKey] = {};
            param[lcKey]["$" + operator] = val;
          } else {
            param[lcKey] = val;
          }
        }
      }

      if (param) addSearchParam(param);
    };


    // Construct searchParams
    for (var key in rawParams) {
      var lcKey = key.toLowerCase()
        , operator = rawParams[key].match(/\{(.*)\}/)
        , val = rawParams[key].replace(/\{(.*)\}/, '');

      if (operator){
        operator = operator[1];
        if (operator == "near") {
          // divide by 69 to convert miles to degrees
          var latlng = val.split(',');
          var distObj = {$near: [parseFloat(latlng[0]), parseFloat(latlng[1])]};
          if(typeof rawParams['radius'] !== 'undefined') {
            distObj.$maxDistance = parseFloat(rawParams['radius']) / 69;
          }
          searchParams[key] = distObj;
        }
      }

      if (val === "") continue;

      else {
        parseSchemaForKey(this.schema, "", lcKey, val, operator);
      }
    }

    // Create the Mongoose Query object.
    query = this.find(searchParams);

    if (cb) {
      query.exec(cb);
    } else {
      return query;
    }
  };
};
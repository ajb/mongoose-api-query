var Monster = require('./model');
var mongooseApiQuery = require('./lib/mongoose-api-query');

module.exports = function(req, res){

  mongooseApiQuery(req.query, {
    custom_params: function(key, val, searchParams) {
      if (key === "zamboni") {
        searchParams["monster_identification_no"] = 1;
        return true;
      }
    },
    model: Monster,
    per_page: 100
  }, function(query, attributes){
    query.exec(function (err, results) {
      res.send(results);
    });
  });

};
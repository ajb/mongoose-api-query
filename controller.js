var Monster = require('./model');

module.exports = function(req, res){

var page = req.query.page || 1
  , perPage = req.query.perPage || 10;

Monster.apiQuery(req.query).limit(perPage).skip((page - 1) * perPage).exec(function(err, monsters) {
    res.send(monsters);
});

};
var m = require('./mongoose-api-query');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var s2 = new Schema({
    items: [new Schema({ name: String })]
});

var a2 = new Schema({
    name: String
});

mongoose.model('a2',a2);
var testSchema = new Schema({
    'test': String,
    'name': String,
    'label': Number,
    'x.y': Boolean,
    't2': [s2]
});

testSchema.plugin(m, {
    options: true
});


var test = mongoose.model('test', testSchema);
test.apiQuery({
    't2.items.name': '{ne}test{ne}12'
});

module.exports = exports = require('./mongoose-api-query');
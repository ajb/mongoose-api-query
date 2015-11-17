var mongooseApiQuery = require('../lib');
var setup = function(mongoose, db, callback) {

    var modelName = 'Monster';

    var monsterSchema = new mongoose.Schema({
        name: String,
        monster_identification_no: Number,
        monster_object_id: mongoose.Schema.ObjectId,
        eats_humans: Boolean,
        foods: [ new mongoose.Schema({
            name: String,
            vegetarian: Boolean,
            calories: Number
        })],
        loc: Array,
        data: {}
    });

    monsterSchema.index({'loc': '2d'});
    monsterSchema.plugin(mongooseApiQuery);


    var Monster = db.model(modelName, monsterSchema);
    var monsters = require('./fixtures');
    var addMonsters = function (monsters) {
        var n = new Monster(monsters.shift());
        n.save(function(){
            if (monsters.length === 0) {
                callback(Monster);
            } else {
                addMonsters(monsters);
            }
        });
    };
    // remove possible entries
    Monster.collection.remove({}, function(err,done) {
        addMonsters(monsters);
    });
};

module.exports = setup;
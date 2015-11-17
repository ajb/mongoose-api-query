var expect   = require('expect.js');
var setup    = require('./setup');
var mongoose = require('mongoose');
var db       = mongoose.createConnection('localhost', 'mongoose-api-query');

describe('mongoose-api-query', function(){
    var test;

    var monsterIndex = function(monsters, name) {
        if (!Array.isArray(monsters)) {
            return -1;
        }
        for (var i=0, len=monsters.length; i<len; i++) {
            if (monsters[i].name===name) {
                return i;
            }
        }
        return -1;
    };

    var hasMonstersInOrder = function(monsters, m1, m2) {
        var index1 = monsterIndex(monsters, m1);
        var index2 = monsterIndex(monsters, m2);
        expect(index1).to.not.equal(-1);
        expect(index2).to.not.equal(-1);
        expect(index1).to.be.lessThan(index2);        
    };

    before(function(done) {
        setup(mongoose, db, function(Monster) {
            test = function(params, callback) {
                Monster.apiQuery(params, callback);
            };
            done();
        });
    });

    describe('core tests', function() {

        it('without any query params, loads all monsters', function(done){
            test({}, function (err, monsters) {
                expect(monsters.length).to.equal(7);
                done();
            });
        });

        it('does case-insensitive searching', function(done){
            test({ 
                name: 'people' 
            }, function(err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('ignores unmatched params', function(done){
            test({
                coffee: 'black'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(7);
                done();
            });
        });

        it('can sort results', function(done){
            test({
                sort_by: 'monster_identification_no,-1'
            }, function (err, monsters) {
                
                hasMonstersInOrder(monsters, 'Bessie the Lochness Monster', 'Big Purple People Eater');
                done();
            });
        });



        it('can sort results on nested params', function(done){
            test({
                sort_by: 'foods.name,1'
            }, function (err, monsters) {
                hasMonstersInOrder(monsters, 'Big Purple People Eater', 'Biggie Smalls the 2nd');
                done();
            });
        });

        it('default sort order is asc', function(done){
            test({
                sort_by: 'foods.name'
            }, function (err, monsters) {
                hasMonstersInOrder(monsters, 'Big Purple People Eater', 'Biggie Smalls the 2nd');
                done();
            });
        });

        it('\'desc\' is valid sort order', function(done){
            test({
                sort_by: 'monster_identification_no,desc'
            }, function (err, monsters) {
                hasMonstersInOrder(monsters, 'Bessie the Lochness Monster', 'Big Purple People Eater');
                done();
            });
        });


        it('works with {near} and no stated radius', function(done){
            test({
                loc: '{near}38.8977,-77.0366'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(6);
                done();
            });
        });

        it('returns correct result for {near} within 1 mile radius', function(done){
            test({
                loc: '{near}38.8977,-77.0366,1'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('returns correct result for {near} within 3 mile radius', function(done){
            test({
                loc: '{near}38.8977,-77.0366,3'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(4);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Frankenstein');
                expect(names).to.contain('Biggie Smalls the 2nd');
                done();
            });
        });

        it('can filter by multiple conditions on the same field', function(done){
            test({
                monster_identification_no: '{gt}200{lt}100439'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Frankenstein');
                done();
            });
        });

        it('excludes results that match {ne} param for Numbers', function(done){
            test({
                monster_identification_no: '{ne}200'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(5);
                done();
            });
        });

        it('excludes results that match {ne} param for Strings, case insensitive', function(done){
            test({
                name: '{ne}biggie'
            }, function (err, monsters) {
                expect(monsters.length).to.equal(5);
                done();
            });
        });

        it('handles paging of results', function(done){
            test({
                page: '2',
                per_page: '4',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                done();
            });
        });

        it('defaults to 10 results per page', function(done){
            test({
                page: '1',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(7);
                done();
            });
        });

        it('can handle schemaless property', function(done){
            test({
                'data.mood': 'sad',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('handles schemaless property with case-insensitivity', function(done){
            test({
                'data.mood': 'SAD',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('can handle schemaless uppercase property', function(done){
            test({
                'data.MODE': 'kill',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('can handle schemaless property number', function(done){
            test({
                'data.hands': '14',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Clay Johnson');
                done();
            });
        });

    });
    describe('SchemaString', function(){

        it('filters without case-sensitivity', function(done){
            test({
                'name': 'big purple',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('doesnt match fuzzy results when using {exact}', function(done){
            test({
                'name': '{exact}big purple',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(0);
                done();
            });
        });

        it('has case sensitivity when using {exact}', function(done){
            test({
                'name': '{exact}big pUrple People Eater',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(0);
                done();
            });
        });

        it('returns correct result with {exact}', function(done){
            test({
                'name': '{exact}Big Purple People Eater',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('does partial matching by default', function(done){
            test({
                'name': 'biggie smalls',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(2);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Biggie Smalls the 2nd');
                done();
            });
        });
    });

    describe('SchemaNumber', function() {
        it('returns correct result for a basic search', function(done){
            test({
                'monster_identification_no': '301',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Frankenstein');
                done();
            });
        });

        it('does not do partial matching by default', function(done){
            test({
                'monster_identification_no': '30',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(0);
                done();
            });

        });

        it('returns correct results for {mod}', function(done){
            test({
                'monster_identification_no': '{mod}150,1',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(2);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Frankenstein');
                expect(names).to.contain('Big Purple People Eater');
                done();
            });
        });

        it('returns correct results for {gt}', function(done){
            test({
                'monster_identification_no': '{gt}100439',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Biggie Smalls the 2nd');
                done();
            });
        });

        it('returns correct results for {gte}', function(done){
            test({
                'monster_identification_no': '{gte}100439',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(2);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Biggie Smalls the 2nd');
                done();
            });
        });

        it('returns correct results for {lt}', function(done){
            test({
                'monster_identification_no': '{lt}200',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(1);
                expect(monsters[0].name).to.equal('Big Purple People Eater');
                done();
            });
        });

        it('returns correct results for {lte}', function(done){
            test({
                'monster_identification_no': '{lte}200',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');
                done();
            });
        });

        it('returns correct results for {in}', function(done){
            test({
                'monster_identification_no': '{in}1,301',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(2);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Frankenstein');

                done();
            });

        });

        it('returns correct results for {in} without {in}', function(done){
            test({
                'monster_identification_no': '1,301',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(2);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Frankenstein');

                done();
            });

        });

        it('excludes results matching values specified in {nin} for Numbers', function(done){
            test({
                'monster_identification_no': '{nin}1,301',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(5);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Biggie Smalls the 2nd');

                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                expect(names).to.contain('AZ124584545');
                done();
            });
        });
        it('excludes results matching values specified in {nin} for Strings, case insensitive', function(done){
            test({
                'name': '{nin}Purple,Enstein',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(5);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Biggie Smalls the 2nd');

                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                expect(names).to.contain('AZ124584545');
                done();
            });
        });


        it('excludes results matching values specified in {nin} for subdocuments', function(done){
            test({
                'foods.name': '{nin}kale,beets',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(5);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Biggie Smalls the 2nd');

                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                expect(names).to.contain('AZ124584545');
                done();
            });
        });

        it('returns correct results for {all}', function(done){
            test({
                'monster_identification_no': '{all}1,301',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(0);
                done();
            });
        });
    });
    describe('SchemaBoolean', function(){
        it('parses \'true\' as true', function(done) {
            test({
                'eats_humans': 'true',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                done();
            });
        });

        it('parses \'t\' as true', function(done){
            test({
                'eats_humans': 't',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                done();
            });
        });

        it('parses \'yes\' as true', function(done){
            test({
                'eats_humans': 'yes',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                done();
            });
        });

        it('parses \'y\' as true', function(done){
            test({
                'eats_humans': 'y',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                done();
            });
        });

        it('parses \'1\' as true', function(done){
            test({
                'eats_humans': '1',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Big Purple People Eater');
                expect(names).to.contain('Bessie the Lochness Monster');
                expect(names).to.contain('Clay Johnson');

                done();
            });
        });

        it('parses anything else as false', function(done){
            test({
                'eats_humans': 'kljahsdflakjsf',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(3);
                var names = monsters.map(function(monster) {
                    return monster.name;
                });
                expect(names).to.contain('Frankenstein');
                expect(names).to.contain('Biggie Smalls');
                expect(names).to.contain('Biggie Smalls the 2nd');

                done();
            });
        });

        it('ignores a blank param', function(done){
            test({
                'eats_humans': '',
            }, function (err, monsters) {
                expect(monsters.length).to.equal(7);
                done();
            });

        });
    });


    describe('SubSchema', function(){

        describe('SchemaString', function(){
            it('does a basic filter', function(done){
                test({
                    'foods.name': 'kale',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('Frankenstein');
                    expect(names).to.contain('Big Purple People Eater');
                    expect(monsters.length).to.equal(2);
                    done();
                });
            });

            it('calculates {all} correctly', function(done){
                test({
                    'foods.name': '{all}kale,beets',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('Big Purple People Eater');
                    expect(monsters.length).to.equal(1);
                    done();
                });
            });

            it('calculates {any} correctly', function(done){
                test({
                    'foods.name': 'kale,beets',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('Frankenstein');
                    expect(names).to.contain('Big Purple People Eater');
                    expect(monsters.length).to.equal(2);
                    done();
                });
            });
        });

        describe('SchemaNumber', function(){
            it('does a basic filter', function(done){
                test({
                    'foods.calories': '{gt}350',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('Biggie Smalls the 2nd');
                    expect(monsters.length).to.equal(1);
                    done();
                });
            });
        });

        describe('SchemaBoolean', function(){
            it('does a basic filter', function(done){
                test({
                    'foods.vegetarian': 't',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('Frankenstein');
                    expect(names).to.contain('Big Purple People Eater');
                    expect(monsters.length).to.equal(2);
                    done();
                });
            });
        });

        describe('SchemaObjectId', function(){
            it('does a basic filter', function(done){
                test({
                    'monster_object_id': '530088897c979cdb49475d9c',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('Clay Johnson');
                    expect(monsters.length).to.equal(1);
                    done();
                });
            });
        });


        describe('RegexpStringContainingNumber', function(){
            it('does a basic filter', function(done){
                test({
                    'name': 'AZ1',
                }, function (err, monsters) {
                    var names = monsters.map(function(monster) {
                        return monster.name;
                    });
                    expect(names).to.contain('AZ124584545');
                    expect(monsters.length).to.equal(1);
                    done();
                });
            });
        });
    });
});



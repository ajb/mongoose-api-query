var hasMonster = function (name) {
    expect(browser.text()).to.contain('"' + name + '"');
};

var hasMonsterCount = function (num) {
    var json = JSON.parse(browser.text());
    expect(json.length).to.equal(num);
};

var hasMonstersInOrder = function (monster1, monster2) {
    var json = browser.text();
    var index1 = json.indexOf(monster1);
    var index2 = json.indexOf(monster2);
    expect(index1).to.not.equal(-1);
    expect(index2).to.not.equal(-1);
    expect(index1).to.be.lessThan(index2);
};

describe('mongoose-api-query', function(){

    it('without any query params, loads all monsters', function(done){
        browser.visit("http://localhost:3000/test1", function () {
            hasMonsterCount(7);
            done();
        });
    });

    it('does case-insensitive searching', function(done){
        browser.visit("http://localhost:3000/test1?name=people", function() {
            hasMonster("Big Purple People Eater");
            done();
        });
    });

    it('ignores unmatched params', function(done){
        browser.visit("http://localhost:3000/test1?coffee=black", function () {
            hasMonsterCount(7);
            done();
        });
    });

    it('can sort results', function(done){
        browser.visit("http://localhost:3000/test1?sort_by=monster_identification_no,-1", function () {
            hasMonstersInOrder("Bessie the Lochness Monster", "Big Purple People Eater");
            done();
        });
    });

    it('can sort results on nested params', function(done){
        browser.visit("http://localhost:3000/test1?sort_by=foods.name,1", function () {
            hasMonstersInOrder("Big Purple People Eater", "Biggie Smalls the 2nd");
            done();
        });
    });

    it('default sort order is asc', function(done){
        browser.visit("http://localhost:3000/test1?sort_by=foods.name", function () {
            hasMonstersInOrder("Big Purple People Eater", "Biggie Smalls the 2nd");
            done();
        });
    });

    it('"desc" is valid sort order', function(done){
        browser.visit("http://localhost:3000/test1?sort_by=monster_identification_no,desc", function () {
            hasMonstersInOrder("Bessie the Lochness Monster", "Big Purple People Eater");
            done();
        });
    });


    it('works with {near} and no stated radius', function(done){
        browser.visit("http://localhost:3000/test1?loc={near}38.8977,-77.0366", function () {
            hasMonsterCount(6);
            done();
        });
    });

    it('returns correct result for {near} within 1 mile radius', function(done){
        browser.visit("http://localhost:3000/test1?loc={near}38.8977,-77.0366,1", function () {
            hasMonsterCount(1);
            hasMonster("Big Purple People Eater");
            done();
        });
    });

    it('returns correct result for {near} within 3 mile radius', function(done){
        browser.visit("http://localhost:3000/test1?loc={near}38.8977,-77.0366,3", function () {
            hasMonsterCount(4);
            hasMonster("Big Purple People Eater");
            hasMonster("Biggie Smalls");
            hasMonster("Frankenstein");
            hasMonster("Biggie Smalls the 2nd");
            done();
        });
    });

    it('can filter by multiple conditions on the same field', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={gt}200{lt}100439", function (){
            hasMonster("Frankenstein");
            hasMonsterCount(1);
            done();
        });
    });

    it('excludes results that match {ne} param for Numbers', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={ne}200", function () {
            hasMonsterCount(5);
            done();
        });
    });

    it('excludes results that match {ne} param for Strings, case insensitive', function(done){
        browser.visit("http://localhost:3000/test1?name={ne}biggie", function () {
            hasMonsterCount(5);
            done();
        });
    });

    it('handles paging of results', function(done){
        browser.visit("http://localhost:3000/test1?page=2&per_page=4", function () {
            hasMonsterCount(3);
            done();
        });
    });

    it('defaults to 10 results per page', function(done){
        browser.visit("http://localhost:3000/test1?page=1", function () {
            hasMonsterCount(7);
            done();
        });
    });

    it('can handle schemaless property', function(done){
        browser.visit("http://localhost:3000/test1?data.mood=sad", function () {
            hasMonster("Big Purple People Eater");
            hasMonsterCount(1);
            done();
        });
    });

    it('handles schemaless property with case-insensitivity', function(done){
        browser.visit("http://localhost:3000/test1?data.mood=SAD", function () {
            hasMonster("Big Purple People Eater");
            hasMonsterCount(1);
            done();
        });
    });

    it('can handle schemaless uppercase property', function(done){
        browser.visit("http://localhost:3000/test1?data.MODE=kill", function () {
            hasMonster("Big Purple People Eater");
            hasMonsterCount(1);
            done();
        });
    });

    it('can handle schemaless property number', function(done){
        browser.visit("http://localhost:3000/test1?data.hands=14", function () {
            hasMonster("Clay Johnson");
            hasMonsterCount(1);
            done();
        });
    });

    describe('SchemaString', function(){
        it('filters without case-sensitivity', function(done){
            browser.visit("http://localhost:3000/test1?name=big%20purple", function (){
                hasMonster("Big Purple People Eater");
                hasMonsterCount(1);
                done();
            });
        });

        it('doesnt match fuzzy results when using {exact}', function(done){
            browser.visit("http://localhost:3000/test1?name={exact}big%20purple", function (){
                hasMonsterCount(0);
                done();
            });
        });

        it('has case sensitivity when using {exact}', function(done){
            browser.visit("http://localhost:3000/test1?name={exact}big%20pUrple%20People%20Eater", function (){
                hasMonsterCount(0);
                done();
            });
        });

        it('returns correct result with {exact}', function(done){
            browser.visit("http://localhost:3000/test1?name={exact}Big%20Purple%20People%20Eater", function (){
                hasMonster("Big Purple People Eater");
                hasMonsterCount(1);
                done();
            });
        });

        it('does partial matching by default', function(done){
            browser.visit("http://localhost:3000/test1?name=biggie%20smalls", function (){
                hasMonster("Biggie Smalls");
                hasMonster("Biggie Smalls the 2nd");
                hasMonsterCount(2);
                done();
            });
        });
    });

describe('SchemaNumber', function(){
    it('returns correct result for a basic search', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no=301", function (){
            hasMonster("Frankenstein");
            hasMonsterCount(1);
            done();
        });
    });

    it('does not do partial matching by default', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no=30", function (){
            hasMonsterCount(0);
            done();
        });
    });

    it('returns correct results for {mod}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={mod}150,1", function (){
            hasMonster("Frankenstein");
            hasMonster("Big Purple People Eater");
            hasMonsterCount(2);
            done();
        });
    });

    it('returns correct results for {gt}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={gt}100439", function (){
            hasMonster("Biggie Smalls the 2nd");
            hasMonsterCount(1);
            done();
        });
    });

    it('returns correct results for {gte}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={gte}100439", function (){
            hasMonster("Biggie Smalls");
            hasMonster("Biggie Smalls the 2nd");
            hasMonsterCount(2);
            done();
        });
    });

    it('returns correct results for {lt}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={lt}200", function (){
            hasMonster("Big Purple People Eater");
            hasMonsterCount(1);
            done();
        });
    });

    it('returns correct results for {lte}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={lte}200", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonsterCount(3);
            done();
        });
    });

    it('returns correct results for {in}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no=1,301", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Frankenstein");
            hasMonsterCount(2);
            done();
        });
    });

    it('excludes results matching values specified in {nin} for Numbers', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={nin}1,301", function (){
            hasMonster("Biggie Smalls");
            hasMonster("Biggie Smalls the 2nd");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonster("AZ124584545");
            hasMonsterCount(5);
            done();
        });
    });

    it('excludes results matching values specified in {nin} for Strings, case insensitive', function(done){
        browser.visit("http://localhost:3000/test1?name={nin}Purple,Enstein", function (){
            hasMonster("Biggie Smalls");
            hasMonster("Biggie Smalls the 2nd");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonster("AZ124584545");
            hasMonsterCount(5);
            done();
        });
    });

    it('excludes results matching values specified in {nin} for subdocuments', function(done){
        browser.visit("http://localhost:3000/test1?foods.name={nin}kale,beets", function (){
            hasMonster("Biggie Smalls");
            hasMonster("Biggie Smalls the 2nd");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonster("AZ124584545");
            hasMonsterCount(5);
            done();
        });
    });

    it('returns correct results for {all}', function(done){
        browser.visit("http://localhost:3000/test1?monster_identification_no={all}1,301", function (){
            hasMonsterCount(0);
            done();
        });
    });
});

describe('SchemaBoolean', function(){
    it('parses "true" as true', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=true", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonsterCount(3);
            done();
        });
    });

    it('parses "t" as true', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=t", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonsterCount(3);
            done();
        });
    });

    it('parses "yes" as true', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=yes", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonsterCount(3);
            done();
        });
    });

    it('parses "y" as true', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=y", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonsterCount(3);
            done();
        });
    });

    it('parses "1" as true', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=1", function (){
            hasMonster("Big Purple People Eater");
            hasMonster("Bessie the Lochness Monster");
            hasMonster("Clay Johnson");
            hasMonsterCount(3);
            done();
        });
    });

    it('parses anything else as false', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=kljahsdflakjsf", function (){
            hasMonster("Frankenstein");
            hasMonster("Biggie Smalls");
            hasMonster("Biggie Smalls the 2nd");
            hasMonsterCount(3);
            done();
        });
    });

    it('ignores a blank param', function(done){
        browser.visit("http://localhost:3000/test1?eats_humans=", function (){
            hasMonsterCount(7);
            done();
        });
    });
});

describe('SubSchema', function(){

    describe('SchemaString', function(){
        it('does a basic filter', function(done){
            browser.visit("http://localhost:3000/test1?foods.name=kale", function (){
                hasMonster("Big Purple People Eater");
                hasMonster("Frankenstein");
                hasMonsterCount(2);
                done();
            });
        });

        it('calculates {all} correctly', function(done){
            browser.visit("http://localhost:3000/test1?foods.name={all}kale,beets", function (){
                hasMonster("Big Purple People Eater");
                hasMonsterCount(1);
                done();
            });
        });

        it('calculates {any} correctly', function(done){
            browser.visit("http://localhost:3000/test1?foods.name=kale,beets", function (){
                hasMonster("Big Purple People Eater");
                hasMonster("Frankenstein");
                hasMonsterCount(2);
                done();
            });
        });
    });

    describe('SchemaNumber', function(){
        it('does a basic filter', function(done){
            browser.visit("http://localhost:3000/test1?foods.calories={gt}350", function (){
                hasMonster("Biggie Smalls the 2nd");
                hasMonsterCount(1);
                done();
            });
        });
    });

    describe('SchemaBoolean', function(){
        it('does a basic filter', function(done){
            browser.visit("http://localhost:3000/test1?foods.vegetarian=t", function (){
                hasMonster("Big Purple People Eater");
                hasMonster("Frankenstein");
                hasMonsterCount(2);
                done();
            });
        });
    });

    describe('SchemaObjectId', function(){
        it('does a basic filter', function(done){
            browser.visit("http://localhost:3000/test1?monster_object_id=530088897c979cdb49475d9c", function (){
                hasMonster("Clay Johnson");
                hasMonsterCount(1);
                done();
            });
        });
    });


    describe('RegexpStringContainingNumber', function(){
        it('does a basic filter', function(done){
            browser.visit("http://localhost:3000/test1?name=AZ1", function (){
                hasMonster("AZ124584545");
                hasMonsterCount(1);
                done();
            });
        });
    });

});

});

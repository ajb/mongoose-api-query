## Overview
If you use Mongoose to help serve results for API calls, you might be used to handling calls like:

    /monsters?color=purple&eats_humans=true

mongoose-api-query handles some of that busywork for you. Pass in a vanilla object (e.g. req.query) and Query conditions will be cast to their appropriate types according to your Mongoose schema; e.g. eats_humans=true to a Boolean.

Supports nested properties like `friends.name=` and operators including `{gt}` `{gte}` `{lt}` `{lte}` `{ne}` `{nin}` `{all}` and `{near}`

All fields of type `String` are searched on in a case-insensitive manner (which is not the default for MongoDB).

## Usage

Apply the plugin to any schema in the usual Mongoose fashion:

    monsterSchema.plugin(mongooseApiQuery);

Then call it like you would using `Model.find`. This returns a Mongoose.Query:

    Monster.apiQuery(req.query).exec(...

Or pass a callback in and it will run `.exec` for you:

    Monster.apiQuery(req.query, function(err, monsters){...

## Examples

`t`, `y`, and `1` are all aliases for `true`:

    /monsters?eats_humans=y&scary=1

Match on a nested property:

    /monsters?foods.name=kale

Comma-separated values assumes `{any}`:

    /monsters?foods.name=kale,beets

Match only if all are true:

    /monsters?foods.name={all}kale,beets

Show everything except this match (loose regex, will match Frankenstein):
    /monsters?name={ne}frank

Show everything except any of these matches:

    /monsters?foods.name={nin}kale,beets

Numeric operators:

    /monsters?monster_id={gte}30&age={lt}50

geo near, with (optional) radius in miles:

    /monsters/v1?latlon={near}38.8977,-77.0366&radius=10


## To run tests

```shell
node load_fixtures.js
node app.js
mocha
```

## License

MIT http://mit-license.org/

## Overview
If you use Mongoose to help serve results for API calls, you might be used to handling calls like:

    /monsters/v1?color=purple&eats_humans=true

mongoose-api-query handles some of that busywork for you. Pass in a vanilla object (e.g. req.query) and it'll return a `Mongoose.Query` that you can further chain onto or call `.exec`. Query conditions will be cast to their appropriate types according to your Mongoose schema; e.g. eats_humans=true to a Boolean.

Supports nested properties like `friends.name=` and operators including `{gt}` `{gte}` `{lt}` `{lte}` `{all}`

## Examples

`t`, `y`, and `1` are all aliases for `true`:

    /monsters/v1?eats_humans=y&scary=1

Match on a nested property:

    /monsters/v1?foods.name=kale

comma-separated values assumes `{any}`:

    /monsters/v1?foods.name=kale,beets

match only if all are true:

    /monsters/v1?foods.name={all}kale,beets

numeric operators:

    /monsters/v1?monster_id={gte}30&age={lt}50

## To run tests

```shell
node load_fixtures.js
node app.js
mocha
```
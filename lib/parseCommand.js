// @TODO allow only keywords
var commandMatchRegex = /\{\w+\}/g;
/**
*   split commands and values 
*   @param {String} value - given string which will be checked for command parameter an value parts
*   @return {Object} an object, that stores the commands as an array in the cmd field and the values in the values field
*/
var parseCommand = function(value) {
    value = String(value);
    var commands = value.match(commandMatchRegex) || [];
    // remove {}
    commands = commands.map(function(item) {
        return item.substr(1,item.length-2);
    });
    var splitVal = value.split(commandMatchRegex);

    return {
        cmd: commands,
        values: splitVal,
    };
};

module.exports = exports = parseCommand;
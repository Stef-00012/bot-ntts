const fs = require('fs');
const handlerData = {}

const handlers = fs.readdirSync(__dirname).filter(file => file != "Loader.js" && fs.statSync(`${__dirname}/${file}`).isFile() && file.endsWith('.js'));

for (const handler of handlers) {
    const handlerFunction = require(`./${handler}`)

    handlerData[handlerFunction.name] = handlerFunction
}

module.exports = handlerData
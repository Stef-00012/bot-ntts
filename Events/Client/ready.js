const mongoose = require('mongoose');
const { mongo } = require('../../config.json');
module.exports = {
    name: 'ready',
    once: true,
    
    async execute(client) {
        mongoose.connect(mongo).then(() => {
            console.log('\x1b[33mSuccessfully connected to the database (MongoDB)\x1b[0m')
        }).catch((err) => {
            console.log(err, '\x1b[31mThere was an error while connecting to the database (MongoDB)\x1b[0m')
        });

        console.log(`${client.user.tag} is online!`)
    }
}
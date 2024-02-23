module.exports = function loadCommands(client) {
    const fs = require('fs');
    const commandCategories = fs.readdirSync(`${process.rootDir}/Commands`).filter(file => fs.statSync(`${process.rootDir}/Commands/${file}`).isDirectory());

    let commandsArray = [];

    for (const commandCategory of commandCategories) {
        const commandFiles = fs.readdirSync(`${process.rootDir}/Commands/${commandCategory}`).filter(file => fs.statSync(`${process.rootDir}/Commands/${commandCategory}/${file}`).isFile() && file.endsWith('.js'));

        for (const command of commandFiles) {
            const commandData = require(`${process.rootDir}/Commands/${commandCategory}/${command}`);

            client.commands.set(commandData.data.name, commandData);
            commandsArray.push(commandData.data.toJSON());

            console.log(`Loaded the command "${commandData.data.name}"`)
        }
    }

    client.application.commands.set(commandsArray);
}
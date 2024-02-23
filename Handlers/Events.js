module.exports = function loadEvents(client) {
    const fs = require('fs');
    const eventCategories = fs.readdirSync(`${process.rootDir}/Events`).filter(file => fs.statSync(`${process.rootDir}/Events/${file}`).isDirectory());

    for (const eventCategory of eventCategories) {
        const eventFiles = fs.readdirSync(`${process.rootDir}/Events/${eventCategory}`).filter(file => fs.statSync(`${process.rootDir}/Events/${eventCategory}/${file}`).isFile() && file.endsWith('.js'));

        for (const event of eventFiles) {
            const eventData = require(`${process.rootDir}/Events/${eventCategory}/${event}`);

            eventData.once
                ? client.once(eventData.name, eventData.execute.bind(null, client))
                : client.on(eventData.name, eventData.execute.bind(null, client))

            console.log(`Loaded the event "${eventData.name}"`)
        }
    }
}
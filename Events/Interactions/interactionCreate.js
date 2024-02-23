const discord = require('discord.js')
module.exports = {
    name: "interactionCreate",
    once: false,
    
    async execute(client, interaction) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                return console.error(`No command matching "${interaction.commandName}" was found.`);
            };

            try {
                await command.execute(client, interaction);
            } catch (e) {
                console.error(e);
                
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: 'An error occurred while executing the command!' });
                } else {
                    await interaction.reply({ content: 'An error occurred while executing the command!', ephemeral: true });
                };
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName)

            if (command && command.autocomplete) {
                try {
                    await command.autocomplete(client, interaction);
                } catch(e) {
                    console.error(e);
                }
            }
            return;
        }
    }
}
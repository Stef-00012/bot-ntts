const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Gives the list of the commands or some info about a specific command')
        .addStringOption(option => {
            return option
                .setName('command')
                .setDescription('The command you want to get info about')
                .setRequired(false)
                .setAutocomplete(true)
        }),
    
    async autocomplete(client, interaction) {
        const value = interaction.options.getFocused();

        const matches = client.commands
            .map(command => ({
                name: command.data.name,
                value: command.data.name
            }))
            .filter(command => command.name.toLowerCase().startsWith(value.toLowerCase()));

        if (matches.length > 25) matches = matches.slice(0, 24);

        await interaction.respond(matches);
    },

    async execute(client, interaction) {
        const command = interaction.options.getString('command');

        if (command) {
            const commandData = client.commands.get(command);

            if (!commandData) return interaction.reply({ content: `No command matching your search "${command}" was found`, ephemeral: true });

            const commandEmbed = new EmbedBuilder()
                .setTitle("Command Information")
                .addFields([
                    {
                        name: "Name:",
                        value: commandData.data.name,
                        inline: true
                    },
                    {
                        name: "descripion:",
                        value: commandData.data.description,
                        inline: true
                    }
                ])
                .setTimestamp();
            
            return await interaction.reply({ embeds: [commandEmbed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true })

        const commands = await client.application.commands.fetch()

        const commandsEmbed = new EmbedBuilder()
            .setDescription(commands.map(cmd => `</${cmd.name}:${cmd.id}>`).join(', '))
            .setTimestamp()

        await interaction.editReply({ embeds: [commandsEmbed] })
    }
}
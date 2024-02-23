const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('\¯\\\_\(\ツ\)\_\/\¯'),
    
    async execute(client, interaction) {
        await interaction.reply('Pong!');
        await interaction.followUp({ content: `My ping is ${client.ws.ping}ms!`, ephemeral: true });
    }
}
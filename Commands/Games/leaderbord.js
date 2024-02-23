const {
    SlashCommandBuilder, EmbedBuilder
} = require('discord.js')
const LeaderboardSchema = require('../../Models/Leaderboard.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('See the leaderboard for each game')
        .addStringOption(option => {
            return option
                .setName('game')
                .setDescription('The game you want to see the leaderboard of')
                .setRequired(true)
                .addChoices({
                    name: 'Rock Paper Scissors Lizard Spock',
                    value: 'RPSLS'
                },
                {
                    name: 'Battleship',
                    value: 'Battleship'
                },
                {
                    name: 'Tic Tac Toe',
                    value: 'Tictactoe'
                })
        })
        .addStringOption(option => {
            return option
                .setName('filter')
                .setDescription('Filter for the leaderboard')
                .setRequired(false)
                .addChoices({
                    name: 'Win',
                    value: 'Win'
                },
                {
                    name: 'Tie',
                    value: 'Tie'
                },
                {
                    name: 'Lose',
                    value: 'Lose'
                })
        })
        .addStringOption(option => {
            return option
                .setName('mode')
                .setDescription('Mode for the leaderboard')
                .setRequired(false)
                .addChoices({
                    name: 'Singleplayer',
                    value: 'Singleplayer'
                },
                {
                    name: 'Multiplayer',
                    value: 'Multiplayer'
                })
        })
        .addStringOption(option => {
            return option
                .setName('level')
                .setDescription('Level filter (only avaible in ttt singleplayer)')
                .setRequired(false)
                .addChoices({
                    name: 'Level 1',
                    value: 'Level1'
                },
                {
                    name: 'Level 2',
                    value: 'Level2'
                },
                {
                    name: 'Level 3',
                    value: 'Level3'
                })
        }),

    async execute(client, interaction) {
        const selectedGame = interaction.options.getString('game')
        const filter = interaction.options.getString('filter') || 'Win'
        const mode = interaction.options.getString('mode') || 'Multiplayer'
        const tttLevel = interaction.options.getString('level') || 1

        if (
            (
                filter == 'Tie' ||
                mode == 'Singleplayer'
            ) &&
            selectedGame == 'Battleship'
        ) return interaction.reply({
            content: 'This filter is not supported for this game',
            ephemeral: true
        })

        await interaction.deferReply()

        const guildUsers = await LeaderboardSchema.find({
            Guild: interaction.guild.id
        })

        if (!guildUsers || guildUsers.length <= 0) return interaction.editReply({
            content: 'There is no data on the leaderboard'
        })

        let userData = []

        for (const user of guildUsers) {
            if (selectedGame == 'Tictactoe' && mode == 'Singleplayer') {
                userData.push({
                    id: user.User,
                    gameData: user.Games[selectedGame][mode][tttLevel][filter] || 0
                })
            } else {
                userData.push({
                    id: user.User,
                    gameData: user.Games[selectedGame][mode][filter] || 0
                })
            }
        }

        userData = userData
            .sort((a, b) => b - a)
            .slice(0, 10)
            .filter(user => user.gameData > 0)
            .map(user => {
                user.name = client.users.cache.get(user.id).tag

                return user;
            })

        if (userData.length <= 0) return interaction.editReply({
            content: 'There is no data on the leaderboard'
        })
        
        let leaderboardString = ''

        for (const userPos in userData) {
            leaderboardString += `${userPos+1}. ${userData[userPos].name} (\`${userData[userPos].id}\`) - ${userData[userPos].gameData}\n`
        }

        const levelLegend = {
            Level1: 'level 1',
            Level2: 'level 2',
            Level3: 'leevl 3'
        }

        const leaderboardEmbed = new EmbedBuilder()
            .setDescription(leaderboardString)
            .setTitle(`${interaction.guild.name}'s Leaderboard for ${selectedGame.toLowerCase()}'s ${mode.toLowerCase()}s in ${filter.toLowerCase()}${selectedGame == 'Tictactoe' && mode == 'Singleplayer' ? ` on ${levelLegend[tttLevel]}` : ''}`)

        return interaction.editReply({
            embeds: [leaderboardEmbed]
        })
    }
}
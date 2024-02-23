// import required modules from the discord.js library
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js')
const LeaderboardSchema = require('../../Models/Leaderboard.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps-lizard-spock')
        .setDescription('Rock Paper Scissors Lizard Spock')
        .addUserOption(option => {
            return option
                .setName('enemy')
                .setDescription('Opponent for RPS Lizard Spock (empty = against a bot) [Ignored if help option is set]')
                .setRequired(false)
        })
        .addBooleanOption(option => {
            return option
                .setName('help')
                .setDescription('Explains how the game works')
                .setRequired(false)
        }),

    async execute(client, interaction) {
        const help = interaction.options.getBoolean('help');

        if (help) {
            // send help embed if the "help" option is set to true
            const helpEmbed = new EmbedBuilder()
                .setTitle('Rock Paper Scissors Lizard Spock Tutorial')
                .setDescription('This is how Rock Paper Scissors Lizard Spock works:\n- Scissors cuts paper (:scissors: > :newspaper:)\n- Paper covers rock (:newspaper: > :rock:)\n- Rock crushes sissors (:rock: > :newspaper:)\n- Rock crushes lizard (:rock: > :lizard:)\n- Lizard poisons Spock (:lizard: > :vulcan:)\n- Spock smashes scissors (:vulcan: > :scissors:)\n- Scissors decapitates lizard (:scissors: > :lizard:)\n- Lizard eats paper (:lizard: > :newspaper:)\n- Paper disproves Spock (:newspaper: > :vulcan:)\n- Spock vaperizes rock (:vulcan: > :rock:)\n\nSource: [The Big Bang Theory](https://www.imdb.com/title/tt2220955/characters/nm0101152)')
                .setTimestamp();
            
            return interaction.reply({
                embeds: [helpEmbed],
                ephemeral: true
            });
        }

        // show an error message if the player is already playing another game of Rock Paper Scissors Lizard Spock in the same channel
        if (client.games.get(`rpsls_${interaction.channel.id}_${interaction.user.id}`)) return interaction.reply({
            content: "You're already playing another game of Rock Paper Scissors Lizard Spock in this channel",
            ephemeral: true
        })

        const selectedEnemy = interaction.options.getUser('enemy');

        // if no enemy is selected, the user plays against the bot
        if (!selectedEnemy) return playRPSLS(interaction.user);

        // show an error message if the selected enemy is a bot
        if (selectedEnemy.bot) return interaction.reply({
            content: "You can't play against another bot...",
            ephemeral: true
        });

        // show an error message if the selected enemy is the user itself
        if (interaction.user.id == selectedEnemy.id) return interaction.reply({
            content: "You can't play against yourself...",
            ephemeral: true
        });

        /* show an error message if the selected enemy can't access the current channel
        (can't read message history or can't view the whole channel) */
        if (
            !interaction.channel.permissionsFor(selectedEnemy.id).has(PermissionFlagsBits.ReadMessageHistory) ||
            !interaction.channel.permissionsFor(selectedEnemy.id).has(PermissionFlagsBits.ViewChannel)
        ) return interaction.reply({
            content: `<@${selectedEnemy.id}> (${selectedEnemy.tag}) doesn't have the permissions to see this channel or the message history, run again the command in a channel they can access`,
            ephemeral: true
        });

        // show an error message if the selected enemy is already playing another game of Rock Paper Scissors Lizard Spock in the same channel
        if (client.games.get(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`)) return interaction.reply({
            content: `<@${selectedEnemy.id}> is already playing another game of Rock Paper Scissors Lizard Spock in this channel`,
            ephemeral: true
        })

        // set the playing status for both the user and the enemy
        client.games.set(`rpsls_${interaction.channel.id}_${interaction.user.id}`, true);
        client.games.set(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`, true);

        const questionEmbed = new EmbedBuilder()
            .setTitle('Rock Paper Scissors Lizard Spock')
            .setDescription(`Do you want to play against <@${interaction.user.id}> (${interaction.user.tag})\nYou have 1 minute to reply`)
            .setTimestamp();

        const acceptButton = new ButtonBuilder()
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success)
            .setCustomId(`rpsls-yes_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`);

        const denyButton = new ButtonBuilder()
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`rpsls-no_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`);

        const row = new ActionRowBuilder().addComponents([acceptButton, denyButton]);

        // send the message asking the enemy if they want to play against the user
        const questionMessage = await interaction.reply({
            content: `<@${selectedEnemy.id}>`,
            embeds: [questionEmbed],
            components: [row]
        });

        /* create an interaction collector to see if the enemy accepts or denies to play
        - ends after 60 seconds (60000 ms)
        - only accepts the IDs of the accept & deny buttons */
        const buttonCollector = questionMessage.createMessageComponentCollector({
            time: 60e3,
            filter: (int) => [
                `rpsls-yes_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`,
                `rpsls-no_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`
            ].includes(int.customId)
        });

        // when a button that matches the collector filter is pressed
        buttonCollector.on('collect', async (int) => {
            // show an error message if the user who presses the button is not the enemy
            if (int.user.id != selectedEnemy.id) return int.reply({
                content: 'This is not your button!',
                ephemeral: true
            });

            const disabledRow = new ActionRowBuilder().addComponents([
                acceptButton.setDisabled(true),
                denyButton.setDisabled(true)
            ]);

            // if the enemy accepts, disable the accept & deny buttons, stop the collector and start the game
            if (int.customId == `rpsls-yes_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`) {
                // disable the buttons
                int.update({
                    components: [disabledRow],
                    embeds: [
                        questionEmbed.setDescription(questionEmbed.data.description + '\n**The user accepted!**')
                    ]
                });

                // stop the collector
                buttonCollector.stop('userReplied');

                // start the game
                return await playRPSLS(interaction.user, selectedEnemy);
            } else {
                // otherwise, if the enemy denies, just disable the accept & deny buttons, remove the playing status and stop the collector
                // disable the buttons
                int.update({
                    components: [disabledRow],
                    embeds: [
                        questionEmbed.setDescription(questionEmbed.data.description + '\n**The user denied!**')
                    ]
                });

                client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);
                client.games.delete(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`);
            }

            // stop the collector
            buttonCollector.stop('userReplied');
        });

        // when the collector ends/is stopped
        buttonCollector.on('end', async (_, reason) => {
            /* if the end reason is time, show an error message saying that the enemy did not reply in time,
            disable the accept & deny buttons and remove the playing status for both the user and the enemy */
            if (reason == 'time') {
                const disabledRow = new ActionRowBuilder().addComponents([
                    acceptButton.setDisabled(true),
                    denyButton.setDisabled(true)
                ]);

                // disable the button
                await questionMessage.edit({
                    components: [disabledRow],
                    embeds: [
                        questionEmbed.setDescription(questionEmbed.data.description + '\n**The user did not reply in time**')
                    ]
                });

                // remove the playing status for both th user and the enemy
                client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);
                client.games.delete(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`);
            }
        })

        // the function used to run the game
        async function playRPSLS(user, enemy) {
            const gameEmbed = new EmbedBuilder()
                .setTitle('Rock Paper Scissors Lizard Spock')
                .setDescription('Use the select menu to choose what will be your move\nYou have 1 minute to reply')
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`rpsls-action_${interaction.channel.id}_${interaction.user.id}${selectedEnemy ? `_${selectedEnemy.id}` : ''}`)
                .setPlaceholder('What is your move?')

            const rockOption = new StringSelectMenuOptionBuilder()
                .setLabel('Rock')
                .setValue('🪨')
                .setEmoji('🪨')
            
            const paperOption = new StringSelectMenuOptionBuilder()
                .setLabel('Paper')
                .setValue('📰')
                .setEmoji('📰')
            
            const scissorsOption = new StringSelectMenuOptionBuilder()
                .setLabel('Scissors')
                .setValue('✂️')
                .setEmoji('✂️')
            
            const lizardOption = new StringSelectMenuOptionBuilder()
                .setLabel('Lizard')
                .setValue('🦎')
                .setEmoji('🦎')
            
            const spockOption = new StringSelectMenuOptionBuilder()
                .setLabel('Spock')
                .setValue('🖖')
                .setEmoji('🖖')

            selectMenu.addOptions([
                rockOption,
                paperOption,
                scissorsOption,
                lizardOption,
                spockOption
            ])

            const row = new ActionRowBuilder().addComponents([selectMenu]);

            // if there's no enemy, play against the bot
            if (!enemy) {
                let userLeaderboardData = await LeaderboardSchema.findOne({
                    User: interaction.user.id,
                    Guild: interaction.guild.id
                })

                if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                    User: interaction.user.id,
                    Guild: interaction.guild.id
                })
                // set the playing status just for the user
                client.games.set(`rpsls_${interaction.channel.id}_${interaction.user.id}`, true);

                gameEmbed.setFooter({
                    text: 'You are playing against the bot'
                });

                // show the embed that asks the user what move they want to do
                const gameMessage = await interaction.reply({
                    embeds: [gameEmbed],
                    components: [row]
                })

                /* create an interaction collector to see if the enemy accepts or denies to play
                - ends after 60 seconds (60000 ms)
                - only accepts the ID of the select menu */
                const gameCollector = gameMessage.createMessageComponentCollector({
                    time: 60e3,
                    filter: (int) => int.customId == `rpsls-action_${interaction.channel.id}_${interaction.user.id}${selectedEnemy ? `_${selectedEnemy.id}` : ''}`
                })

                // when the select menu is used
                gameCollector.on('collect', async (int) => {
                    // show an error message if the user who used the select menu is not the user
                    if (int.user.id != user.id) return int.reply({
                        content: 'This is not your button!',
                        ephemeral: true
                    });

                    const disabledRow = new ActionRowBuilder().addComponents([selectMenu.setDisabled(true)]);

                    // disable the select menu
                    await gameMessage.edit({
                        components: [disabledRow]
                    });

                    // save the user move
                    const userChoice = int.values[0];

                    const avaibleChoices = ['🪨', '📰', '✂️', '🦎', '🖖'];

                    // randomly choose the bot's move
                    const botChoice = avaibleChoices[Math.floor(Math.random() * avaibleChoices.length)];

                    // use a function to check who the winner is
                    const winner = checkWinner(userChoice, botChoice);

                    const tieEmbed = new EmbedBuilder()
                        .setTitle("Well... it's a tie")
                        .setDescription(`Both of you chose ${userChoice}...`)
                        .setTimestamp()
                    
                    /* if the winner function returns 2, it's a tie so shows the tie message,
                    stop the collector and end the game removing the playing status on the user */
                    if (winner == 2) {
                        // remove the playing status on the user
                        client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);

                        // stop the collector
                        gameCollector.stop('gameEnded');

                        // show the tie message
                        await int.reply({
                            embeds: [tieEmbed]
                        });

                        if (!userLeaderboardData.Games.RPSLS.Singleplayer.Tie) userLeaderboardData.Games.RPSLS.Singleplayer.Tie = 0

                        userLeaderboardData.Games.RPSLS.Singleplayer.Tie += 1

                        return await userLeaderboardData.save()
                    }

                    const endEmbed = new EmbedBuilder()
                        .setTitle(`The winner is ${winner == 0 ? 'you' : 'the bot'}`)
                        .setDescription(`- You chose ${userChoice}\n- The bot chose ${botChoice}`)
                        .setTimestamp();

                    // if it's not a tie, show the winner message
                    await int.reply({
                        embeds: [endEmbed]
                    });

                    // stop the collector
                    gameCollector.stop('gameEnded');

                    // remove the playing status on the user
                    client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);

                    if (winner == 0) {
                        if (!userLeaderboardData.Games.RPSLS.Singleplayer.Win) userLeaderboardData.Games.RPSLS.Singleplayer.Win = 0

                        userLeaderboardData.Games.RPSLS.Singleplayer.Win += 1

                        return await userLeaderboardData.save()
                    } else {
                        if (!userLeaderboardData.Games.RPSLS.Singleplayer.Lose) userLeaderboardData.Games.RPSLS.Singleplayer.Lose = 0

                        userLeaderboardData.Games.RPSLS.Singleplayer.Lose += 1

                        return await userLeaderboardData.save()
                    }
                })

                // when the collector ends/is stopped
                gameCollector.on('end', async (_, reason) => {
                    // if the reason is time, disable the select menu and show an error message telling the user he did not reply in time
                    if (reason == 'time') {
                        const disabledRow = new ActionRowBuilder().addComponents([selectMenu.setDisabled(true)])

                        // disable the select menu and show the error message
                        await gameMessage.edit({
                            components: [disabledRow],
                            embeds: [
                                gameEmbed.setDescription(gameEmbed.data.description + '\n**You did not select your move in time**')
                            ]
                        })

                        // remove the playing status on the user
                        client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);
                    }
                })
            } else {
                let userLeaderboardData = await LeaderboardSchema.findOne({
                    User: inter.user.id,
                    Guild: inter.guild.id
                })

                if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                    User: inter.user.id,
                    Guild: inter.guild.id
                })

                let enemyLeaderboardData = await LeaderboardSchema.findOne({
                    User: inter.user.id,
                    Guild: inter.guild.id
                })

                if (!enemyLeaderboardData) enemyLeaderboardData = new LeaderboardSchema({
                    User: inter.user.id,
                    Guild: inter.guild.id
                })

                // otherwise, if the enemy is selected
                gameEmbed.setFooter({
                    text: `You are playing against ${enemy.tag}`
                });

                // show the embed that asks both the user and the enemy what move they want to do
                const gameMessage = await interaction.followUp({
                    embeds: [gameEmbed],
                    components: [row]
                });

                /* create an interaction collector to see if the enemy accepts or denies to play
                - ends after 60 seconds (60000 ms)
                - only accepts the ID of the select menu */
                const gameCollector = gameMessage.createMessageComponentCollector({
                    time: 60e3,
                    filter: (int) => int.customId == `rpsls-action_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`
                });

                // save the users choices in an object
                const userChoices = {};

                // when the select menu is used
                gameCollector.on('collect', async (int) => {
                    // show an error message if the user who used the select menu is not the enemy or the user
                    if (![enemy.id, user.id].includes(int.user.id)) return int.reply({
                        content: 'This is not your button!',
                        ephemeral: true
                    });

                    // show an error message if the user already selected his move
                    if (userChoices[int.user.id]) return int.reply({
                        content: 'You already selected your answer',
                        ephemeral: true
                    })

                    // save the user move in the object defined mefore
                    userChoices[int.user.id] = int.values[0]

                    // show a confirmation message telling the user what move they selected
                    int.reply({
                        content: `You selected ${int.values[0]}`,
                        ephemeral: true
                    })

                    // if both the user and the enemy selected their move, disable the select menu and stop the collector with the reason "bothUsersReplied"
                    if (Object.entries(userChoices).length == 2) {
                        // stop the collector
                        gameCollector.stop('bothUsersReplied')

                        const disabledRow = new ActionRowBuilder().addComponents([selectMenu.setDisabled(true)]);

                        // disable the select menu
                        await gameMessage.edit({
                            components: [disabledRow]
                        })
                    }
                })

                // when the collector ends/is stopped
                gameCollector.on('end', async (_, reason) => {
                    /* if the reason is tiime, show an error message telling the users that one of them
                    did not reply in time, disable the select menu and remove their playing status */
                    if (reason == 'time') {
                        const disabledRow = new ActionRowBuilder().addComponents([selectMenu.setDisabled(true)]);

                        // disable the select menu and show the error message
                        await gameMessage.edit({
                            components: [disabledRow],
                            embeds: [
                                gameEmbed.setDescription(gameEmbed.data.description + '\n**One of the users did not choose their move in time**')
                            ]
                        })

                        // remove the playing status on both the user and the enemy
                        client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);
                        client.games.delete(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`);
                    } else if (reason == 'bothUsersReplied') {
                        // otherwise if the reason is "bothUsersReplied"
                        const choiceData = Object.entries(userChoices);

                        // use a function to check who the winner is
                        const winner = checkWinner(choiceData[0][1], choiceData[1][1]);

                        const tieEmbed = new EmbedBuilder()
                            .setTitle("Well... it's a tie")
                            .setDescription(`Both of you chose ${choiceData[0][1]}...`)
                            .setTimestamp()
                        
                        /* if the winner functions returns 2, it's a tie, so show the tie message,
                        remove the playing status on both the user and the enemy and end the game */
                        if (winner == 2) {
                            // remove the playing status
                            client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);
                            client.games.delete(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`);

                            // show the tie message
                            await gameMessage.reply({
                                embeds: [tieEmbed]
                            });

                            if (!userLeaderboardData.Games.RPSLS.Multiplayer.Tie) userLeaderboardData.Games.RPSLS.Multiplayer.Tie = 0
                            if (!enemyLeaderboardData.Games.RPSLS.Multiplayer.Tie) enemyLeaderboardData.Games.RPSLS.Multiplayer.Tie = 0

                            userLeaderboardData.Games.RPSLS.Multiplayer.Tie += 1
                            enemyLeaderboardData.Games.RPSLS.Multiplayer.Tie += 1

                            await userLeaderboardData.save()
                            await enemyLeaderboardData.save()

                            return;
                        }

                        const endEmbed = new EmbedBuilder()
                            .setTitle(`The winner is ${client.users.cache.get(choiceData[winner][0]).tag}`)
                            .setDescription(`- <@${choiceData[0][0]}> chose ${choiceData[0][1]}\n- <@${choiceData[1][0]}> chose ${choiceData[1][1]}`)
                            .setTimestamp();
                        
                        // if it's not a tie, show the winner message
                        await gameMessage.reply({
                            embeds: [endEmbed]
                        });

                        // remove the playing status on both the user and the enemy
                        client.games.delete(`rpsls_${interaction.channel.id}_${interaction.user.id}`);
                        client.games.delete(`rpsls_${interaction.channel.id}_${selectedEnemy.id}`);

                        if (userLeaderboardData.User == choiceData[winner][0]) {
                            if (!userLeaderboardData.Games.RPSLS.Multiplayer.Win) userLeaderboardData.Games.RPSLS.Multiplayer.Win = 0
                            if (!enemyLeaderboardData.Games.RPSLS.Multiplayer.Lose) enemyLeaderboardData.Games.RPSLS.Multiplayer.Lose = 0

                            userLeaderboardData.Games.RPSLS.Multiplayer.Win += 1
                            enemyLeaderboardData.Games.RPSLS.Multiplayer.Lose += 1
                        } else {
                            if (!enemyLeaderboardData.Games.RPSLS.Multiplayer.Win) enemyLeaderboardData.Games.RPSLS.Multiplayer.Win = 0
                            if (!userLeaderboardData.Games.RPSLS.Multiplayer.Lose) userLeaderboardData.Games.RPSLS.Multiplayer.Lose = 0
                            
                            enemyLeaderboardData.Games.RPSLS.Multiplayer.Win += 1
                            userLeaderboardData.Games.RPSLS.Multiplayer.Lose += 1
                        }

                        await userLeaderboardData.save()
                        await enemyLeaderboardData.save()
                    }
                })
            }
        }

        /* the function used to check the winner
        NUMBER LEGEND:
        - 0: wins the first user
        - 1: wins the second user
        - 2: it's a tie
        
        EMOJI LEGEND:
        - ✂️ beats 📰
        - 📰 beats 🪨
        - 🪨 beats 📰
        - 🪨 beats 🦎
        - 🦎 beats 🖖
        - 🖖 beats ✂️
        - ✂️ beats 🦎
        - 🦎 beats 📰
        - 📰 beats 🖖
        - 🖖 beats 🪨
        */
        function checkWinner(input1, input2) {
            // if the first input is the same as the second input, return 2, tie
            if (input1 == input2) return 2;

            // if the first input beats the second input, return 0, wins the first user
            if (input1 == '✂️' && input2 == '📰') return 0;
            if (input1 == '📰' && input2 == '🪨') return 0;
            if (input1 == '🪨' && input2 == '✂️') return 0;
            if (input1 == '🪨' && input2 == '🦎') return 0;
            if (input1 == '🦎' && input2 == '🖖') return 0;
            if (input1 == '🖖' && input2 == '✂️') return 0;
            if (input1 == '✂️' && input2 == '🦎') return 0;
            if (input1 == '🦎' && input2 == '📰') return 0;
            if (input1 == '📰' && input2 == '🖖') return 0;
            if (input1 == '🖖' && input2 == '🪨') return 0;

            // if the second input beats the input input, return 1, wins the first user
            if (input2 == '✂️' && input1 == '📰') return 1;
            if (input2 == '📰' && input1 == '🪨') return 1;
            if (input2 == '🪨' && input1 == '✂️') return 1;
            if (input2 == '🪨' && input1 == '🦎') return 1;
            if (input2 == '🦎' && input1 == '🖖') return 1;
            if (input2 == '🖖' && input1 == '✂️') return 1;
            if (input2 == '✂️' && input1 == '🦎') return 1;
            if (input2 == '🦎' && input1 == '📰') return 1;
            if (input2 == '📰' && input1 == '🖖') return 1;
            if (input2 == '🖖' && input1 == '🪨') return 1;
        }
    }
}
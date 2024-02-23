// import required modules from the discord.js library
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require('discord.js')
const LeaderboardSchema = require('../../Models/Leaderboard.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('battleship')
        .setDescription('Play battleship against another user')
        .addUserOption(option => {
            return option
                .setName('enemy')
                .setDescription('The user you want to play battleship with')
                .setRequired(true)
        }),

    async execute(client, interaction) {
        const selectedEnemy = interaction.options.getUser('enemy')

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
        ) return interaction.reply({ content: `<@${selectedEnemy.id}> (${selectedEnemy.tag}) doesn't have the permissions to see this channel or the message history, run again the command in a channel they can access`, ephemeral: true });

        // show an error message if the selected enemy is already playing another game of Battleship in the same channel
        if (client.games.get(`bs_${interaction.channel.id}_${selectedEnemy.id}`)) return interaction.reply({
            content: `<@${selectedEnemy.id}> is already playing another game of battleship in this channel`,
            ephemeral: true
        });

        // set the playing status for both the user and the enemy
        client.games.set(`bs_${interaction.channel.id}_${interaction.user.id}`, true);
        client.games.set(`bs_${interaction.channel.id}_${selectedEnemy.id}`, true);

        const questionEmbed = new EmbedBuilder()
            .setTitle('Battleship')
            .setDescription(`Do you want to play against <@${interaction.user.id}> (${interaction.user.tag})\nYou have 5 minutes to reply`)
            .setTimestamp();

        const acceptButton = new ButtonBuilder()
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success)
            .setCustomId(`bs-yes_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`);

        const denyButton = new ButtonBuilder()
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`bs-no_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`);

        const row = new ActionRowBuilder().addComponents([acceptButton, denyButton]);

        // send the message asking the enemy if they want to play against the user
        const questionMessage = await interaction.reply({
            content: `<@${selectedEnemy.id}>`,
            embeds: [questionEmbed],
            components: [row]
        });

        /* create an interaction collector to see if the enemy accepts or denies to play
        - ends after 5 minutes (300000 ms)
        - only accepts the IDs of the accept & deny buttons */
        const buttonCollector = questionMessage.createMessageComponentCollector({
            time: 60*5e3,
            filter: (int) => [
                `bs-yes_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`,
                `bs-no_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`
            ].includes(int.customId)
        });

        // when a button that matches the collector filter is pressed
        buttonCollector.on('collect', async (int) => {
            const disabledRow = new ActionRowBuilder().addComponents([
                acceptButton.setDisabled(true),
                denyButton.setDisabled(true)
            ]);

            // when the deny button is pressed
            if (int.customId == `bs-no_${interaction.channel.id}_${interaction.user.id}_${selectedEnemy.id}`) {
                // show an error message if the user who presses the button is not the enemy or the user
                if (![interaction.user.id, selectedEnemy.id].includes(int.user.id)) return int.reply({
                    content: 'This is not your button!',
                    ephemeral: true
                });

                // edit the mian message when the request is denied
                int.update({
                    components: [disabledRow],
                    embeds: [
                        questionEmbed.setDescription(questionEmbed.data.description + int.user.id == interaction.user.id ? '\n**The user cancelled the request**' : '\n**The user denied**')
                    ]
                });

                // remove the playing status for both the user and the enemy
                client.games.delete(`bs_${interaction.channel.id}_${interaction.user.id}`);
                client.games.delete(`bs_${interaction.channel.id}_${selectedEnemy.id}`);

                return;
            }

            // show an error message if the user who presses the button is not the enemy
            if (int.user.id != selectedEnemy.id) return int.reply({
                content: 'This is not your button!',
                ephemeral: true
            });

            // if the enemy accepts, disable the accept & deny buttons, stop the collector and start the game
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
            return await placeShips(interaction.user, selectedEnemy);
        });

        // when the collector ends/is stopped
        buttonCollector.on('end', (_, reason) => {
            /* if the end reason is time, show an error message saying that the enemy did not reply in time,
            disable the accept & deny buttons and remove the playing status for both the user and the enemy */
            if (reason == 'time') {
                const disabledRow = new ActionRowBuilder().addComponents([
                    acceptButton.setDisabled(true),
                    denyButton.setDisabled(true)
                ]);

                // disable the button
                questionMessage.edit({
                    components: [disabledRow],
                    embeds: [
                        questionEmbed.setDescription(questionEmbed.data.description + '\n**The user did not reply in time**')
                    ]
                });

                // remove the playing status for both the user and the enemy
                client.games.delete(`bs_${interaction.channel.id}_${interaction.user.id}`);
                client.games.delete(`bs_${interaction.channel.id}_${selectedEnemy.id}`);
            }
        })

        // whetever both user setupped their boats
        let usersReply = {
            [interaction.user.id]: false,
            [selectedEnemy.id]: false
        }

        // legend that lnks short codes to emoji
        const emojiLegend = {
            W1: '<:w1:1210330091117350994>', // water empty
            W2: '<:w2:1210330096825536533>', // water miss
            W3: '<:w3:1210330094359543888>', // water hit
            S1: '<:s1:1210330085446656022>', // ship
            S2: '<:s2:1210330088491589662>', // ship hit
            H1: '<:h1:1210288831652302908>', // hit user
            H2: '<:h2:1210288829190250507>', // hit enemy
            H3: '<:h3:1210288826753351720>', // hit both
            A: '<:lA:1207676295702511676>', // letter A
            B: '<:lB:1207676298214903909>', // letter B
            C: '<:lC:1207676300190285874>', // letter C
            D: '<:lD:1207676302111416361>', // letter D
            E: '<:lE:1207676304225476608>', // letter E
            F: '<:lF:1207676306628542467>', // letter F
            G: '<:lG:1207676309023625246>', // letter G
            H: '<:lH:1207676311376760943>', // letter H
            I: '<:lI:1207676313549410334>', // letter I
            J: '<:lJ:1207706547564847114>', // letter J
            '1': '<:n1:1207674681709305876>', // number 1
            '2': '<:n2:1207675341380915210>', // number 2
            '3': '<:n3:1207675344157413458>', // number 3
            '4': '<:n4:1207675346267148379>', // number 4
            '5': '<:n5:1207675348284874802>', // number 5
            '6': '<:n6:1207675350516113419>', // number 6
            '7': '<:n7:1207675353162715176>', // number 7
            '8': '<:n8:1207675362172076042>', // number 8
            '9': '<:n9:1207675372636999771>', // number 9
            '10': '<:n0:1207675375401041950>', // number 10
            _E: '<:e_:1207677242218385438>' // empty space
        }

        // legend that links numbers to letters
        const letterLegend = {
            1: 'A',
            2: 'B',
            3: 'C',
            4: 'D',
            5: 'E',
            6: 'F',
            7: 'G',
            8: 'H',
            9: 'I',
            10: 'J'
        }

        // creation of the mepty board
        const emptyBoard = []

        for (let i = 0; i < 11; i++) {
            if (i == 0) {
                emptyBoard[i] = ['_E', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
                continue;
            }

            const boardRow = new Array(10).fill('W1')
            boardRow.unshift(letterLegend[i])

            emptyBoard[i] = boardRow
        }

        // the boards of the users
        let userBoards = {
            [interaction.user.id]: JSON.parse(JSON.stringify(emptyBoard)),
            [selectedEnemy.id]: JSON.parse(JSON.stringify(emptyBoard))
        }

        // the boards of the users containing the hits
        let userHitsBoards = {
            [interaction.user.id]: JSON.parse(JSON.stringify(emptyBoard)),
            [selectedEnemy.id]: JSON.parse(JSON.stringify(emptyBoard))
        }

        // legend that links ship name to the number of slots they use
        const shipLegend = {
            carrier: 5,
            battleship: 4,
            destroyer: 3,
            submarine: 3,
            patrolBoat: 2
        }

        // function used to let place the user ships
        async function placeShips(user, enemy) {
            const setupEmbed = new EmbedBuilder()
                .setDescription('Use this button to place your ships!')

            const setupButton = new ButtonBuilder()
                .setLabel('Setup your ships')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`bs-setupShip_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`);

            const setupButtonRow = new ActionRowBuilder().addComponents([setupButton])

            const setupMessage = await interaction.channel.send({
                content: `<@${user.id}> & <@${enemy.id}>`,
                embeds: [setupEmbed],
                components: [setupButtonRow]
            })

            /* create a collector to setup the ships
            - ends after 5 minutes (300000 ms)
            - only accepts the setup button ID
            */
            const buttonCollector = setupMessage.createMessageComponentCollector({
                time: 60*5e3,
                filter: (int) => int.customId == `bs-setupShip_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`
            });

            // when a button that matches the collector filter is pressed
            buttonCollector.on('collect', async (int) => {
                // show an error message if the user who presses the button is not the enemy or the user
                if (![user.id, enemy.id].includes(int.user.id)) return int.reply({
                    content: 'This is not your button!',
                    ephemeral: true
                });

                // show an error message if th user already replied
                if (usersReply[int.user.id]) return int.reply({
                    content: 'You already set up your boats...',
                    ephemeral: true
                });

                const setupShipModal = new ModalBuilder()
                    .setCustomId(`shipSetup_${int.user.id}`)
                    .setTitle("Position your ships")

                const carrierInput = new TextInputBuilder()
                    .setCustomId("carrier")
                    .setLabel(`Carrier position? [${shipLegend.carrier} slots]`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Example: A5h")
                    .setMaxLength(4)
                    .setMinLength(2)
                    .setRequired(true)

                const battleshipInput = new TextInputBuilder()
                    .setCustomId("battleship")
                    .setLabel(`Battleship position? [${shipLegend.battleship} slots]`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Example: C3v")
                    .setMaxLength(4)
                    .setMinLength(2)
                    .setRequired(true)

                const destroyerInput = new TextInputBuilder()
                    .setCustomId("destroyer")
                    .setLabel(`Destroyer position? [${shipLegend.destroyer} slots]`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Example: H8h")
                    .setMaxLength(4)
                    .setMinLength(2)
                    .setRequired(true)

                const submarineInput = new TextInputBuilder()
                    .setCustomId("submarine")
                    .setLabel(`Submarine position? [${shipLegend.submarine} slots]`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Example: D5h")
                    .setMaxLength(4)
                    .setMinLength(2)
                    .setRequired(true)
                    
                const patrolBoatInput = new TextInputBuilder()
                    .setCustomId("patrolBoat")
                    .setLabel(`Patrol boat position? [${shipLegend.patrolBoat} slots]`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Example: B9h")
                    .setMaxLength(4)
                    .setMinLength(2)
                    .setRequired(true)

                const carrierRow = new ActionRowBuilder().addComponents([
                    carrierInput
                ])

                const battleshipRow = new ActionRowBuilder().addComponents([
                    battleshipInput
                ])

                const destroyerRow = new ActionRowBuilder().addComponents([
                    destroyerInput
                ])

                const submarineRow = new ActionRowBuilder().addComponents([
                    submarineInput
                ])

                const patrolBoatRow = new ActionRowBuilder().addComponents([
                    patrolBoatInput
                ])

                setupShipModal.addComponents([
                    carrierRow,
                    battleshipRow,
                    destroyerRow,
                    submarineRow,
                    patrolBoatRow
                ])

                // show a modal asking the location of the 5 boats
                await int.showModal(setupShipModal)

                // await the modal submission
                int.awaitModalSubmit({
                    filter: (interaction) => interaction.customId == `shipSetup_${int.user.id}`,
                    time: 60*3e3
                }).then(async (inter) => {
                    // defer the modal reply
                    await inter.deferReply({
                        ephemeral: true
                    })

                    // this RegExp checked if the user input matches the valid battleship locations
                    const validShipDataRegex = /^([A-J])([1-9]|10)(v|h)?$/i

                    // the location data of each boat
                    const carrierData = inter.fields.getTextInputValue('carrier').match(validShipDataRegex)
                    const battleshipData = inter.fields.getTextInputValue('battleship').match(validShipDataRegex)
                    const destroyerData = inter.fields.getTextInputValue('destroyer').match(validShipDataRegex)
                    const submarineData = inter.fields.getTextInputValue('submarine').match(validShipDataRegex)
                    const patrolBoatData = inter.fields.getTextInputValue('patrolBoat').match(validShipDataRegex)

                    // show an error if one of the boat locations in invalid
                    if (
                        !carrierData ||
                        !battleshipData ||
                        !destroyerData ||
                        !submarineData ||
                        !patrolBoatData
                    ) return inter.editReply({
                        content: "One of your boats contains an invalid position",
                        ephemeral: true
                    })

                    // if the positions are valid, place them on the board
                    const positionsValid = await placeShipsOnBoard(inter.user.id, {
                        carrier: carrierData.slice(1, 4),
                        battleship: battleshipData.slice(1, 4),
                        destroyer: destroyerData.slice(1, 4),
                        submarine: submarineData.slice(1, 4),
                        patrolBoat: patrolBoatData.slice(1, 4)
                    })

                    // show an error when two boats by the same user overlap
                    if (!positionsValid) return inter.editReply({
                        content: 'One of your ships overlaps another ship, place them again avoiding any overlap\nUse the button to place your ships again'
                    })

                    const boardEmbed = new EmbedBuilder()
                        .setDescription(displayBoard(userBoards[inter.user.id]))
                        .setTitle('Your board')

                    // show the user board when the user places their boats
                    inter.editReply({
                        embeds: [boardEmbed]
                    })

                    // if both user placed they boats, disable the setup button and start the game
                    if (Object.values(usersReply).every(reply => reply)) {
                        const disabledSetupRow = new ActionRowBuilder().addComponents(setupButton.setDisabled(true))

                        // disable the setup button
                        setupMessage.edit({
                            components: [disabledSetupRow]
                        })

                        // start thr game
                        return await startGame(user, enemy);
                    }
                })
            });

            // when the collector ends/is stopped
            buttonCollector.on('end', (_, reason) => {
                /* if the end reason is time, show an error message saying that the enemy did not reply in time,
                disable the accept & deny buttons and remove the playing status for both the user and the enemy */
                if (reason == 'time') {
                    const disabledRow = new ActionRowBuilder().addComponents([
                        setupButton.setDisabled(true)
                    ]);
    
                    // disable the setup button and show the time error message
                    setupMessage.edit({
                        components: [disabledRow],
                        embeds: [
                            setupEmbed.setDescription(setupEmbed.data.description + '\n**One of the users did not reply in time**')
                        ]
                    });
    
                    // remove the playing status for both th user and the enemy
                    client.games.delete(`bs_${interaction.channel.id}_${user.id}`);
                    client.games.delete(`bs_${interaction.channel.id}_${enemy.id}`);
                }
            })
        }

        // function used to place the ships from the "placeShips" function onto the user board
        async function placeShipsOnBoard(userId, shipsData) {
            // loop over all the ships and get the row, column and direction they are placed in, also the slots the use
            for (const ship in shipsData) {
                let row = userBoards[userId].findIndex(row => row[0].toUpperCase() == shipsData[ship][0].toUpperCase())
                let column = shipsData[ship][1]
                const direction = shipsData[ship][2]
                let slots = shipLegend[ship]

                // if the direction is "v" (vertical) place the boat vertically
                if (direction == 'v') {
                    // loop until slots is 0, so when all boat's slots have been placed
                    do {
                        // if the boat slot hits a water slot, return false, showing an error to the user where the function is used
                        if (userBoards[userId][row][column] != 'W1') return false;
                        
                        /* otherwise change the water slot to a ship slot, increase by 1 the row to
                        place the next boat slot in and decrease by one the missing boat slots to place */
                        userBoards[userId][row][column] = 'S1'
                        row++
                        slots--
                    } while (slots > 0)
                } else {
                    // else, so if the direction is NOT "v", place the boat horizontally
                    // loop until slots is 0, so when all boat's sots have been placed
                    do {
                        // if the boat slot hits a water slot, return false, showing an error to the user where the function is used
                        if (userBoards[userId][row][column] != 'W1') return false;

                        /* otherwise change the water slot to a ship slot, increase by 1 the column to
                        place the next boat slot in and decrease by one the missing boat slots to place */
                        userBoards[userId][row][column] = 'S1'
                        column++
                        slots--
                    } while (slots > 0)
                }
            }

            // change the userReply object confirming that the user has setup their own boats
            usersReply[userId] = true

            // return true and show a success message where the function is used
            return true;
        }

        // function used to convert the board from unreadable text for the user to user-friendly emojis 
        function displayBoard(board) {
            // make a copy if the user board, so the user board is not modified in the process
            let boardToDisplay = JSON.parse(JSON.stringify(board))
            
            // loop through all the letters in the board (so all the rows)
            for (let boardLetter = 0; boardLetter < boardToDisplay.length; boardLetter++) {
                // use the map function to convert every array item to its emoji equivalent
                boardToDisplay[boardLetter] = boardToDisplay[boardLetter].map(item => emojiLegend[item]).join('')
            }

            // convert the array to a string using the join function
            boardToDisplay = boardToDisplay.join('\n')

            // return the emoji-converted board
            return boardToDisplay;
        }

        // function used to check if all of the boats have been destroyed in the board
        function checkBoard(board) {
            // make a copy if the user board, so the user board is not modified in the process
            let boardToCheck = JSON.parse(JSON.stringify(board))

            //make an array storing true/false values based on if the row contains a ship slot (S1)
            const rowsAllSlotsDestroyed = []

            // loop through all the board rows (except first which is the numbers row)
            for (let i = 1; i < boardToCheck.length; i++) {
                // exclude first row item, which is the row letter
                boardToCheck[i].shift()

                /* if all the slots in the selected row are not ships (S1) return
                true otherwise return false because there's still a ship */
                if (boardToCheck[i].every(boardToCheckItem => boardToCheckItem != 'S1')) rowsAllSlotsDestroyed.push(true)
                else rowsAllSlotsDestroyed.push(false)
            }

            /* if the array contains all truthy items (so in this case all "true" since it only gets pushed boolean values),
            return true, meaning all the boats have been destroyed otherwise return false, meaning there's still atleast a
            boat on the board */
            if (rowsAllSlotsDestroyed.every(slot => slot)) return true;
            else return false
        }

        // function used to run the actual game
        async function startGame(user, enemy) {
            // store the user and enemy id
            const ids = [user.id, enemy.id]

            // randomly choose the first turn user
            let currentTurn = ids[Math.floor(Math.random() * ids.length)]

            const viewBoardButton = new ButtonBuilder()
                .setLabel('View board')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`bs-viewBoard_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`);
            
            const viewHitsBoard = new ButtonBuilder()
                .setLabel('View hits')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`bs-viewHits_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`)

            const attackButton = new ButtonBuilder()
                .setLabel('Attack')
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`bs-attack_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`);

            const gameRow = new ActionRowBuilder().addComponents([
                attackButton,
                viewBoardButton,
                viewHitsBoard
            ])

            const startGameEmbed = new EmbedBuilder()
                .setTitle('Battleship')
                .setDescription(`The game has started, it's <@${currentTurn}>'s turn\nUse those buttons to view your board and attack your opponent`)

            /* show the game message with the buttons to attack, wiew your own board (which includes enemy's hits)
            and view your hit boards (which shows the hits you sent to the enemy WITHOUT showing their boats) */
            const gameMessage = await interaction.channel.send({
                content: `<@${user.id}> & <@${enemy.id}>`,
                embeds: [startGameEmbed],
                components: [gameRow]
            })

            /* create a collector to listen to the attack, view board and view hits buttons
            - ends after 1 hour (3600000 ms)
            - only accept the 3 buttons IDs
            */
            const gameCollector = gameMessage.createMessageComponentCollector({
                time: 60*60e3,
                filter: (int) => [
                    `bs-viewBoard_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`,
                    `bs-viewHits_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`,
                    `bs-attack_${interaction.channel.id}_${user.id}_${selectedEnemy.id}`
                ].includes(int.customId)
            })

            // when a button that matches the collector filter is pressed
            gameCollector.on('collect', async (int) => {
                // if the pressed button is the button to see the own board
                if (int.customId.startsWith('bs-viewBoard')) {
                    // show an error message if the user who pressed the button is not the user or the enemy
                    if (![user.id, enemy.id].includes(int.user.id)) return int.reply({
                        content: "That's not your button!",
                        ephemeral: true
                    })

                    const userDisplayedBoard = displayBoard(userBoards[int.user.id])
    
                    const boardEmbed = new EmbedBuilder()
                        .setDescription(`**Emoji legend**:\n- ${emojiLegend['W1']} - Water without an hit\n- ${emojiLegend['W2']} - Water with an enemy missed hit\n- ${emojiLegend['S1']} - Ship without a hit\n- ${emojiLegend['S2']} - Ship hit by the enemy\n\n${userDisplayedBoard}`)
                        .setTitle('Your board')
    
                    // show the user his own board
                    return int.reply({
                        embeds: [boardEmbed],
                        ephemeral: true
                    })
                }

                // if the pressed button is the button to see the hits board
                if (int.customId.startsWith('bs-viewHits')) {
                    // show an error message if the user who pressed the button is not the user or the enemy
                    if (![user.id, enemy.id].includes(int.user.id)) return int.reply({
                        content: "That's not your button!",
                        ephemeral: true
                    })

                    const userDisplayedBoard = displayBoard(userHitsBoards[int.user.id])
    
                    const boardEmbed = new EmbedBuilder()
                        .setDescription(`**Emoji legend**:\n- ${emojiLegend['W1']} - Water without an hit\n- ${emojiLegend['W2']} - Water with a own missed hit\n- ${emojiLegend['W3']} - Water with an own successful hit\n\n${userDisplayedBoard}`)
                        .setTitle('Your hits board')
    
                    //show the hits board
                    return int.reply({
                        embeds: [boardEmbed],
                        ephemeral: true
                    })
                }

                // otherwise the button pressed is the attack button, so check if it's the correct person to press the button
                if (int.user.id != currentTurn) return int.reply({
                    content: "It's not your turn!",
                    ephemeral: true
                })

                const attackModal = new ModalBuilder()
                    .setCustomId(`shipSetup_${int.user.id}`)
                    .setTitle("Position your ships")

                const positionInput = new TextInputBuilder()
                    .setCustomId("location")
                    .setLabel(`What slot do you want to attack?`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Example: A5")
                    .setMaxLength(3)
                    .setMinLength(2)
                    .setRequired(true)

                const positionRow = new ActionRowBuilder().addComponents([positionInput])

                attackModal.addComponents([positionRow])

                // show the modal asking the user where they want to attack
                await int.showModal(attackModal)

                // await the modal submission
                int.awaitModalSubmit({
                    time: 60*5e3
                }).then(async (inter) => {
                    await inter.deferReply({
                        ephemeral: true
                    })

                    // regex to check if the hit location is valid
                    const validShipDataRegex = /^([A-J])([1-9]|10)$/i

                    // get the hit location data form th modal and check if it's correct with the regex
                    const location = inter.fields.getTextInputValue('location').match(validShipDataRegex)

                    // show an error message if the location is missing, so doesn't match the regex
                    if (!location) return inter.editReply({
                        content: 'Invalid position. Use the button to try to attack again',
                        ephemeral: true
                    })

                    // get the row and column where to attack from the user selected location
                    const row = userBoards[inter.user.id].findIndex(row => row[0].toUpperCase() == location[1].toUpperCase())
                    const column = location[2]

                    // set the opponent ID to the user who has not sumbitted the modal
                    const opponentId = ids.filter(id => id != inter.user.id)

                    // show an error message if the user doesn't hits a water slot (W1) on the enemy hits board (meaning they already hit that location)
                    if (userHitsBoards[inter.user.id][row][column] != 'W1') return inter.editReply({
                        content: 'You already hit this position. Use the button to select another position',
                        ephemeral: true
                    })

                    // if the user hits a water slot (W1) on the enemy board
                    if (userBoards[opponentId][row][column] == 'W1') {
                        // chnage the slot to water miss (W2) on both the hits board and the enemy board
                        userHitsBoards[inter.user.id][row][column] = 'W2'
                        userBoards[opponentId][row][column] = 'W2'

                        // chage current turn to the next user
                        currentTurn = opponentId

                        // edit original message updating whose turn it is
                        await gameMessage.edit({
                            embeds: [startGameEmbed.setDescription(`It's <@${currentTurn}>'s turn\nUse those buttons to view your board and attack your opponent`)]
                        })

                        // tell the user they missed
                        inter.editReply({
                            content: 'You missed...',
                            ephemeral: true
                        })

                        // send a message mentioning the next user who has to hit
                        return gameMessage.reply({
                            content: `<@${currentTurn}>, it's your turn!`
                        })
                    }

                    // if the user hits a ship slot (S1) on the enemy board
                    if (userBoards[opponentId][row][column] == 'S1') {
                        // change the slot to water hit (W3) on the hits board and S2 and to ship hit (S2) on the enemy board
                        userHitsBoards[inter.user.id][row][column] = 'W3'
                        userBoards[opponentId][row][column] = 'S2'

                        // check if all the enemy boards got destoryed
                        const allBoatsDestroyed = checkBoard(userBoards[opponentId])

                        // if all the enemy boats got destroyed
                        if (allBoatsDestroyed) {
                            const disabledRow = new ActionRowBuilder().addComponents([
                                attackButton.setDisabled(true),
                                viewBoardButton.setDisabled(true),
                                viewHitsBoard.setDisabled(true)
                            ])

                            // disable the attack, view board and view hits buttons
                            await gameMessage.edit({
                                components: [disabledRow]
                            })

                            // remove the playing status for both the user and the enemy
                            client.games.delete(`bs_${interaction.channel.id}_${interaction.user.id}`);
                            client.games.delete(`bs_${interaction.channel.id}_${selectedEnemy.id}`);

                            const winEmbed = new EmbedBuilder()
                                .setTitle('Battleship')
                                .setDescription(`<@${inter.user.id}> destroyed all <@${opponentId}>'s boats and won!`)

                            // send a message telling who won
                            await inter.editReply({
                                content: `<@${inter.user.id}> & <@${opponentId}>`,
                                embeds: [winEmbed]
                            })

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

                            if (!userLeaderboardData.Games.Battleship.Win) userLeaderboardData.Games.Battleship.Win = 0
                            if (!enemyLeaderboardData.Games.Battleship.Lose) enemyLeaderboardData.Games.Battleship.Lose = 0

                            userLeaderboardData.Games.Battleship.Win += 1
                            enemyLeaderboardData.Games.Battleship.Lose += 1

                            await userLeaderboardData.save()
                            await enemyLeaderboardData.save()
                        }

                        // otherwise chnage the current turn to the next user
                        currentTurn = opponentId

                        // edit the original message telling whose turn it is
                        await gameMessage.edit({
                            embeds: [startGameEmbed.setDescription(`It's <@${currentTurn}>'s turn\nUse those buttons to view your board and attack your opponent`)]
                        })

                        // tell the user they hit a boat
                        inter.editReply({
                            content: 'You hit a boat!',
                            ephemeral: true
                        })

                        // send a message mentioning the user who has to attack next
                        return gameMessage.reply({
                            content: `<@${currentTurn}>, it's your turn!`
                        })
                    }
                })
            })

            // whne the collector ends/is stopped
            gameCollector.on('end', async (_, reason) => {
                // if the reason is time
                if (reason == 'time') {
                    const disabledRow = new ActionRowBuilder().addComponents([
                        attackButton.setDisabled(true),
                        viewBoardButton.setDisabled(true),
                        viewHitsBoard.setDisabled(true)
                    ])

                    // disable the attack, view board and view hits buttons
                    await gameMessage.edit({
                        components: [disabledRow],
                        embeds: [startGameEmbed.setDescription(startGameEmbed.data.description + '\n**The user did not reply in time**')]
                    })

                    // remove the playing status for both the user and the enemy
                    client.games.delete(`bs_${interaction.channel.id}_${interaction.user.id}`);
                    client.games.delete(`bs_${interaction.channel.id}_${selectedEnemy.id}`);
                }
            })
        }
    }
}
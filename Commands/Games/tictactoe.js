const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const LeaderboardSchema = require('../../Models/Leaderboard.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play tic tac toe against someone or against the bot')
        .addUserOption(option => {
            return option
                .setName('enemy')
                .setDescription('The user you want to play tic tac toe with (leave empty to play aganst the bot)')
                .setRequired(false)
        })
        .addIntegerOption(option => {
            return option
                .setName('level')
                .setDescription('Hardness level when playing against the bot')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(3)
        }),

    async execute(client, interaction) {
        const { options } = interaction;
        const difficultyLevel = options.getInteger('level') || 2; // Get the difficulty level or set the default value to 2
        const enemy = options.getUser('enemy'); // Get the opponent user (if present)
        if (enemy && enemy.id === interaction.user.id) return interaction.reply({ content: "You can't play against yourself!", ephemeral: true });
        if (enemy && enemy.bot) return interaction.reply({ content: "You can't play against a bot!", ephemeral: true });

        await interaction.deferReply(); // Suspend the initial reply to prevent timeout

        // Create three rows of buttons to represent the Tic Tac Toe board
        const buttons = new ActionRowBuilder()
            .addComponents(
                // Create buttons numbered from 1 to 3
                new ButtonBuilder()
                    .setCustomId(`1-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),

                new ButtonBuilder()
                    .setCustomId(`2-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),

                new ButtonBuilder()
                    .setCustomId(`3-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),
            );

        const buttons2 = new ActionRowBuilder()
            .addComponents(
                // Create buttons numbered from 4 to 6
                new ButtonBuilder()
                    .setCustomId(`4-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),

                new ButtonBuilder()
                    .setCustomId(`5-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),

                new ButtonBuilder()
                    .setCustomId(`6-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),
            );

        const buttons3 = new ActionRowBuilder()
            .addComponents(
                // Create buttons numbered from 6 to 9
                new ButtonBuilder()
                    .setCustomId(`7-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),

                new ButtonBuilder()
                    .setCustomId(`8-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),

                new ButtonBuilder()
                    .setCustomId(`9-${interaction.id}-${interaction.user.id}`)
                    .setLabel("\u200b")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),
        );
        
        if (enemy) {
            // If there's an opponent, update the custom IDs of buttons with the opponent's user ID
            buttons.components[0].setCustomId(`1-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons.components[1].setCustomId(`2-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons.components[2].setCustomId(`3-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons2.components[0].setCustomId(`4-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons2.components[1].setCustomId(`5-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons2.components[2].setCustomId(`6-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons3.components[0].setCustomId(`7-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons3.components[1].setCustomId(`8-${interaction.id}-${interaction.user.id}-${enemy.id}`);
            buttons3.components[2].setCustomId(`9-${interaction.id}-${interaction.user.id}-${enemy.id}`);
        }

        // Initialize the board with all cells empty
        const board = {
            c1: false,
            c2: false,
            c3: false,
            c4: false,
            c5: false,
            c6: false,
            c7: false,
            c8: false,
            c9: false,
        };

        let currentPlayer = 'X'; // Start with player X

        // Function to check if all cells are filled
        function checkAllCellsFilled() {
            for (let cell in board) {
                if (board.hasOwnProperty(cell) && board[cell] === false) {
                    return false; // If even one cell is false, the function returns false
                }
            }
            return true; // If all cells are filled (not false), the function returns true
        }

        // Function to check for a winner
        function checkWinner() {
            // Returns 'X' if X wins, 'O' if O wins, 'Tie' if it's a tie, otherwise false
            if (board.c1 === "X" && board.c2 === "X" && board.c3 === "X") {
                return "X"
            } else if (board.c4 === "X" && board.c5 === "X" && board.c6 === "X") {
                return "X"
            } else if (board.c7 === "X" && board.c8 === "X" && board.c9 === "X") {
                return "X"
            } else if (board.c1 === "X" && board.c4 === "X" && board.c7 === "X") {
                return "X"
            } else if (board.c2 === "X" && board.c5 === "X" && board.c8 === "X") {
                return "X"
            } else if (board.c3 === "X" && board.c6 === "X" && board.c9 === "X") {
                return "X"
            } else if (board.c1 === "X" && board.c5 === "X" && board.c9 === "X") {
                return "X"
            } else if (board.c3 === "X" && board.c5 === "X" && board.c7 === "X") {
                return "X"
            } else if (board.c1 === "O" && board.c2 === "O" && board.c3 === "O") {
                return "O"
            } else if (board.c4 === "O" && board.c5 === "O" && board.c6 === "O") {
                return "O"
            } else if (board.c7 === "O" && board.c8 === "O" && board.c9 === "O") {
                return "O"
            } else if (board.c1 === "O" && board.c4 === "O" && board.c7 === "O") {
                return "O"
            } else if (board.c2 === "O" && board.c5 === "O" && board.c8 === "O") {
                return "O"
            } else if (board.c3 === "O" && board.c6 === "O" && board.c9 === "O") {
                return "O"
            } else if (board.c1 === "O" && board.c5 === "O" && board.c9 === "O") {
                return "O"
            } else if (board.c3 === "O" && board.c5 === "O" && board.c7 === "O") {
                return "O"
            };

            if (checkAllCellsFilled()) {
                return "Tie"
            };

            return false;
        }

        // Function to set button labels and styles based on player's move
        function label(id, player) {
            if (player === 'X') {
                if (id === '1') buttons.components[0].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '2') buttons.components[1].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '3') buttons.components[2].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '4') buttons2.components[0].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '5') buttons2.components[1].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '6') buttons2.components[2].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '7') buttons3.components[0].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '8') buttons3.components[1].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
                if (id === '9') buttons3.components[2].setLabel('X').setDisabled(true).setStyle(ButtonStyle.Danger);
            } else if (player === 'O') {
                if (id === '1') buttons.components[0].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '2') buttons.components[1].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '3') buttons.components[2].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '4') buttons2.components[0].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '5') buttons2.components[1].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '6') buttons2.components[2].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '7') buttons3.components[0].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '8') buttons3.components[1].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
                if (id === '9') buttons3.components[2].setLabel('O').setDisabled(true).setStyle(ButtonStyle.Primary);
            }
        }

        // Function to disable all buttons on the board
        function disableButtons() {
            for (const button of buttons.components) { button.setDisabled(true) };
            for (const button of buttons2.components) { button.setDisabled(true) };
            for (const button of buttons3.components) { button.setDisabled(true) };
        }

        if (!enemy) {
            // If there's no opponent, start a game against the bot
            const date = Math.floor(Date.now() / 1000 + 3600);
            // HARD DIFFICULTY
            // MINIMAX FUNCTION - Logic to determine the best move for the computer
            function minimax(board, depth, isMaximizing) {
                const scores = {
                    X: -10,
                    O: 10,
                    Tie: 0
                };

                const winner = checkWinner();
                if (winner !== false) {
                    return scores[winner];
                }

                if (isMaximizing) {
                    let bestScore = -Infinity;
                    for (const cell in board) {
                        if (board.hasOwnProperty(cell) && board[cell] === false) {
                            board[cell] = "O";
                            const score = minimax(board, depth + 1, false);
                            board[cell] = false;
                            bestScore = Math.max(bestScore, score);
                        }
                    }
                    return bestScore;
                } else {
                    let bestScore = Infinity;
                    for (const cell in board) {
                        if (board.hasOwnProperty(cell) && board[cell] === false) {
                            board[cell] = "X";
                            const score = minimax(board, depth + 1, true);
                            board[cell] = false;
                            bestScore = Math.min(bestScore, score);
                        }
                    }
                    return bestScore;
                }
            }
            // HARD DIFFICULTY

            // MEDIUM DIFFICULTY
            // EVALUATE BOARD FUNCTION - Logic to evaluate the situation on the board
            function evaluateBoard() {
                const winPatterns = [
                    ["c1", "c2", "c3"],
                    ["c4", "c5", "c6"],
                    ["c7", "c8", "c9"],
                    ["c1", "c4", "c7"],
                    ["c2", "c5", "c8"],
                    ["c3", "c6", "c9"],
                    ["c1", "c5", "c9"],
                    ["c3", "c5", "c7"]
                ];

                let computerScore = false;
                let playerScore = false;
                let win = false;

                for (const pattern of winPatterns) {
                    const [a, b, c] = pattern;
                    if ((board[a] === "O" && board[b] === "O" && board[c] === false) ||
                    (board[a] === "O" && board[b] === false && board[c] === "O") ||
                    (board[a] === false && board[b] === "O" && board[c] === "O")) {
                        computerScore = true; // If the opponent has two signs in a row, increase the computer's score
                    };

                    if ((board[a] === "X" && board[b] === "X" && board[c] === false) ||
                    (board[a] === "X" && board[b] === false && board[c] === "X") ||
                    (board[a] === false && board[b] === "X" && board[c] === "X")) {
                        playerScore = true; // If the player has two marks in a row, increase the player's score
                    }
                    
                    if (board[a] === "O" && board[b] === "O" && board[c] === "O") {
                        win = true
                    }
                }
                if(win) { return 4 } else if(computerScore && !playerScore) { return 3 } else if(!playerScore) { return 2 } else { return 0 }
                // return computerScore - playerScore;
            }
            // MEDIUM DIFFICULTY

            // COMPUTER MOVE FUNCTION - Logic for the computer's move based on the difficulty level
            function makeComputerMove() {
                let move;
                // HARD DIFFICULTY
                if (difficultyLevel === 3) {
                    let bestScore = -Infinity;
                    let bestMove;
                    let bestMoves = [];

                    for (const cell in board) {
                        if (board.hasOwnProperty(cell) && board[cell] === false) {
                            board[cell] = "O";
                            const score = minimax(board, 0, false);
                            board[cell] = false;
                            
                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = cell;
                                bestMoves.push({ cell, score });
                            } else if (score === bestScore) {
                                bestMoves.push({ cell, score });
                            }
                        }
                    }
                    if (bestMoves.length > 0) {
                        const moves = bestMoves.filter(m => m.score === bestScore)
                        if (moves.length > 0) {
                            const randomIndex = Math.floor(Math.random() * moves.length)
                            const move2 = moves[randomIndex]
                            bestMove = move2.cell;
                        }
                    }
                    move = bestMove;
                    board[bestMove] = "O";
                }
                // HARD DIFFICULTY

                // MEDIUM DIFFICULTY
                if (difficultyLevel === 2) {
                    let bestScore = -Infinity;
                    let bestMove;
                    let bestMoves = [];

                    for (const cell in board) {
                        if (board.hasOwnProperty(cell) && board[cell] === false) {
                            board[cell] = "O";
                            const score = evaluateBoard();
                            board[cell] = false;

                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = cell;
                                bestMoves.push({ cell, score });
                            } else if (score === bestScore) {
                                bestMoves.push({ cell, score });
                            }
                        }
                    }
                    if (bestMoves.length > 0) {
                        const moves = bestMoves.filter(m => m.score === bestScore)
                        if (moves.length > 0) {
                            const randomIndex = Math.floor(Math.random() * moves.length)
                            const move2 = moves[randomIndex]
                            bestMove = move2.cell;
                        }
                    }
                    move = bestMove;
                    board[bestMove] = "O";
                }
                // MEDIUM DIFFICULTY

                //EASY DIFFICULTY (random choices)
                if (difficultyLevel === 1) {
                    const emptyCells = [];

                    // Scan all cells on the board and add the empty (false) cells to the emptyCells array
                    for (const cell in board) {
                        if (board.hasOwnProperty(cell) && board[cell] === false) {
                            emptyCells.push(cell);
                        }
                    }

                    // Choose a random cell among the blank cells
                    const randomIndex = Math.floor(Math.random() * emptyCells.length);
                    const randomCell = emptyCells[randomIndex];

                    // Make the opponent's move by setting the chosen cell with the symbol "O"
                    move = randomCell;
                    board[randomCell] = "O";
                }
                //EASY DIFFICULTY

                let mId;
                if (move.endsWith('1')) mId = '1';
                if (move.endsWith('2')) mId = '2';
                if (move.endsWith('3')) mId = '3';
                if (move.endsWith('4')) mId = '4';
                if (move.endsWith('5')) mId = '5';
                if (move.endsWith('6')) mId = '6';
                if (move.endsWith('7')) mId = '7';
                if (move.endsWith('8')) mId = '8';
                if (move.endsWith('9')) mId = '9';
                label(mId, currentPlayer);

                currentPlayer = "X";
            }

            // Function to handle the next move
            async function promptNextMove(i) {
                // Check if the current player is 'X'
                if (currentPlayer === 'X') {
                    let mId;
                    // Determine the button pressed by checking its custom ID prefix
                    // and update the corresponding cell on the board with 'X'
                    if (i.customId.startsWith('1')) mId = '1';
                    if (i.customId.startsWith('2')) mId = '2';
                    if (i.customId.startsWith('3')) mId = '3';
                    if (i.customId.startsWith('4')) mId = '4';
                    if (i.customId.startsWith('5')) mId = '5';
                    if (i.customId.startsWith('6')) mId = '6';
                    if (i.customId.startsWith('7')) mId = '7';
                    if (i.customId.startsWith('8')) mId = '8';
                    if (i.customId.startsWith('9')) mId = '9';
                    board[`c${mId}`] = currentPlayer; // Update the board with the current player's move
                    label(mId, currentPlayer); // Set button label and style

                    // Check if the current move results in a win for 'X'
                    if (checkWinner() === "X") {
                        let userLeaderboardData = await LeaderboardSchema.findOne({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })

                        if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })
                    
                        disableButtons(); // Disable all buttons on the board
                        await i.editReply({ content: `You won!`, components: [buttons, buttons2, buttons3] })

                        if (!userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Win) userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Win = 0
                        userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Win += 1

                        await userLeaderboardData.save()

                        return;
                    };

                    // Check if the game is a tie
                    if (checkWinner() === "Tie") {
                        let userLeaderboardData = await LeaderboardSchema.findOne({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })

                        if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })

                        disableButtons(); // Disable all buttons on the board
                        await i.editReply({ content: `It's a tie!`, components: [buttons, buttons2, buttons3] })

                        if (!userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie) userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie = 0
                        userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie += 1

                        await userLeaderboardData.save()

                        return;
                    };

                    // Continue the game, prompt for the next move and switch to 'O'
                    i.editReply({ content: `Expires <t:${date}:R>\nYour move:`, components: [buttons, buttons2, buttons3] })

                    currentPlayer = 'O';

                    // Set a timeout to simulate the computer's move after a delay
                    setTimeout(async () => {
                        makeComputerMove(); // Execute the computer's move

                        // Check if the computer wins
                        if (checkWinner() === "O") {
                            let userLeaderboardData = await LeaderboardSchema.findOne({
                                User: interaction.user.id,
                                Guild: interaction.guild.id
                            })

                            if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                                User: interaction.user.id,
                                Guild: interaction.guild.id
                            })
                            
                            disableButtons(); // Disable all buttons on the board
                            await i.editReply({ content: `The computer wins!`, components: [buttons, buttons2, buttons3] })

                            if (!userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Lose) userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Lose = 0
                            userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Lose += 1

                            await userLeaderboardData.save()

                            return;
                        }

                        // Check if the game is a tie after the computer's move
                        if (checkWinner() === "Tie") {
                            let userLeaderboardData = await LeaderboardSchema.findOne({
                                User: interaction.user.id,
                                Guild: interaction.guild.id
                            })

                            if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                                User: interaction.user.id,
                                Guild: interaction.guild.id
                            })

                            disableButtons(); // Disable all buttons on the board
                            await i.editReply({ content: `It's a tie!`, components: [buttons, buttons2, buttons3] })

                            if (!userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie) userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie = 0
                            userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie += 1

                            await userLeaderboardData.save()

                            return;
                        };

                        // Prompt for the next move after the computer's turn
                        i.editReply({ content: `Expires <t:${date}:R>\nComputer's move:`, components: [buttons, buttons2, buttons3] })
                    }, 2000) // Delay of 2000 milliseconds (2 seconds) before the computer's move
                } else {
                    // If the current player is not 'X', make the computer's move directly
                    makeComputerMove();

                    // Check if the computer wins
                    if (checkWinner() === "O") {
                        let userLeaderboardData = await LeaderboardSchema.findOne({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })

                        if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })
                    
                        disableButtons(); // Disable all buttons on the board
                        await i.editReply({ content: `The computer wins!`, components: [buttons, buttons2, buttons3] })

                        if (!userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Lose) userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Lose= 0
                        userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Lose += 1

                        await userLeaderboardData.save()

                        return;
                    }

                    // Check if the game is a tie after the computer's move
                    if (checkWinner() === "Tie") {
                        let userLeaderboardData = await LeaderboardSchema.findOne({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })

                        if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                            User: interaction.user.id,
                            Guild: interaction.guild.id
                        })

                        disableButtons(); // Disable all buttons on the board
                        await i.editReply({ content: `It's a tie!`, components: [buttons, buttons2, buttons3] })

                        if (!userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie) userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie = 0
                        userLeaderboardData.Games.Tictactoe.Singleplayer[`Level${difficultyLevel}`].Tie += 1

                        await userLeaderboardData.save()
                        
                        return;
                    };

                    // Prompt for the next move after the computer's turn
                    i.editReply({ content: `Expires <t:${date}:R>\nComputer's move:`, components: [buttons, buttons2, buttons3] })
                }
            }

            const message = await interaction.editReply({ content: `Expires <t:${date}:R>`, components: [buttons, buttons2, buttons3] });

            // Create a collector to listen for button clicks within a time limit
            const collector = await message.createMessageComponentCollector({
                time: 60 * 60 * 1000, // 1 hour time limit
                filter: (int) => int.customId === `1-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `2-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `3-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `4-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `5-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `6-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `7-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `8-${interaction.id}-${interaction.user.id}` ||
                    int.customId === `9-${interaction.id}-${interaction.user.id}`
            });

            // Event handler for when a button is clicked
            collector.on('collect', async i => {
                // Check if the user clicking the button is the one who initiated the game
                if (i.user.id !== interaction.user.id) { return i.reply({ content: 'This isn\'t your game!', ephemeral: true }) }

                // Check if it's the player's turn and the selected cell is empty
                if (currentPlayer !== 'X') { return i.reply({ content: 'Wait for the computer\'s move!', ephemeral: true }) }
            
                if (board[`c${i.customId.charAt(0)}`] !== false) {
                    await i.reply({ content: "This cell has already been selected!", ephemeral: true })
                } else {
                    await i.deferUpdate()
                    await promptNextMove(i) // Proceed with the player's move
                }
            });

            // Event handler for when the button collector ends
            collector.on('end', async i => {
                try {
                    disableButtons();
                    await interaction.editReply({ content: 'Time is up!', components: [buttons, buttons2, buttons3] })
                    return;
                } catch (e) {
                    return;
                };
            });
        } else {
            // If there is an opponent, start a game against him
            const date = Math.floor(Date.now() / 1000 + 300);
            let date2;

            // Create buttons for accepting or denying the invitation
            const buttonsAccept = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept-${interaction.id}-${interaction.user.id}-${enemy.id}`)
                        .setLabel("Accept")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(false),

                    new ButtonBuilder()
                        .setCustomId(`deny-${interaction.id}-${interaction.user.id}-${enemy.id}`)
                        .setLabel("Deny")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(false)
                );
            
            // Create an embed for the invitation
            const embed = new EmbedBuilder()
                .setTitle('Tic tac toe')
                .setDescription(`You have received an invitation from ${interaction.user} to play Tic Tac Toe!\nThe invitation expires <t:${date}:R>`)
            
            // Sends the game invitation
            const message = await interaction.editReply({ content: `${enemy}`, embeds: [embed], components: [buttonsAccept] });

            // Create a collector for handling button clicks on the invitation
            const collector = await message.createMessageComponentCollector({
                time: 5 * 60 * 1000, // 5 minutes time limit for accepting or denying the invitation
                filter: (int) => int.customId === `accept-${interaction.id}-${interaction.user.id}-${enemy.id}` || int.customId === `deny-${interaction.id}-${interaction.user.id}-${enemy.id}`
            });

            // Event handler for button clicks on the invitation
            collector.on('collect', async i => {
                if (i.user.id === enemy.id) {
                    if (i.customId.startsWith('accept')) {
                        // Handle accepting the invitation
                        embed.setDescription(`The invitation from ${interaction.user} has been accepted!`)
                        await i.update({ embeds: [embed], components: [] });
                        date2 = Math.floor(Date.now() / 1000 + 3600);
                        const msg = await i.followUp({ content: `Expires <t:${date2}:R>\nIt's ${interaction.user}'s turn:`, components: [buttons, buttons2, buttons3] });
                        startDuel(msg, interaction.id, interaction.user.id, enemy.id)
                        collector.stop('accepted')
                    } else {
                        // Handle denying the invitation
                        embed.setDescription(`The invitation from ${interaction.user} has been denied`)
                        return i.update({ embeds: [embed], components: [] })
                    }
                } else if (i.user.id === interaction.user.id && i.customId.startsWith('deny')) {
                    // Handle canceling the invitation by the initiator
                    embed.setDescription(`The invitation from ${interaction.user} has been canceled!`)
                    return i.update({ embeds: [embed], components: [] })
                } else { i.reply({ content: 'This isn\'t your game!', ephemeral: true }) };
            });

            // Event handler for the end of the invitation collector
            collector.on('end', async (_, reason) => {
                if (reason === 'time') {
                    // Handle expiration of the invitation
                    embed.setDescription(`The invitation from ${interaction.user} has expired!\nTry asking him to resend it!`)
                    return interaction.editReply({ embeds: [embed], components: [] })
                }
            });

            // Function to start the game after accepting the invitation
            function startDuel(msg, intId, uId, eId) {
                currentPlayer = 'X';
                const collector2 = msg.createMessageComponentCollector({
                    time: 60 * 60 * 1000, // 1 hour time limit for the game
                    filter: (int) => int.customId === `1-${intId}-${uId}-${eId}` ||
                        int.customId === `2-${intId}-${uId}-${eId}` ||
                        int.customId === `3-${intId}-${uId}-${eId}` ||
                        int.customId === `4-${intId}-${uId}-${eId}` ||
                        int.customId === `5-${intId}-${uId}-${eId}` ||
                        int.customId === `6-${intId}-${uId}-${eId}` ||
                        int.customId === `7-${intId}-${uId}-${eId}` ||
                        int.customId === `8-${intId}-${uId}-${eId}` ||
                        int.customId === `9-${intId}-${uId}-${eId}`
                });

                // Event handler for button clicks during the game
                collector2.on('collect', async i => {
                    if (i.user.id === uId || i.user.id === eId) {
                        if (board[`c${i.customId.charAt(0)}`] !== false) {
                            await i.reply({ content: "This cell has already been selected!", ephemeral: true })
                        } else {
                            if (currentPlayer === 'X' && i.user.id === uId) {
                                await i.deferUpdate()
                                nextMoove(i, uId, eId);
                            } else if (currentPlayer === 'O' && i.user.id === eId) {
                                await i.deferUpdate()
                                nextMoove(i, uId, eId);
                            } else { i.reply({ content: 'Wait for your turn!', ephemeral: true }) }
                        }
                    } else { i.reply({ content: 'This isn\'t your game!', ephemeral: true }) }
                });

                // Event handler for the end of the game collector
                collector2.on('end', async i => {
                    try {
                        disableButtons();
                        await msg.edit({ content: `Time is up!\n<@${uId}> <@${eId}>`, components: [buttons, buttons2, buttons3] })
                    } catch (e) {
                        return
                    }
                });
            };
            async function nextMoove(i, uId, eId) {
                let mId;

                if (i.customId.startsWith("1")) mId = "1";
                if (i.customId.startsWith("2")) mId = "2";
                if (i.customId.startsWith("3")) mId = "3";
                if (i.customId.startsWith("4")) mId = "4";
                if (i.customId.startsWith("5")) mId = "5";
                if (i.customId.startsWith("6")) mId = "6";
                if (i.customId.startsWith("7")) mId = "7";
                if (i.customId.startsWith("8")) mId = "8";
                if (i.customId.startsWith("9")) mId = "9";
                board[`c${mId}`] = currentPlayer;
                label(mId, currentPlayer);

                // Check if the current move results in a win for 'X' or 'O'
                if (checkWinner() === currentPlayer) {
                    let u, e;
                    if (currentPlayer === 'X') { u = uId; e = eId } else { u = eId; e = uId }

                    let winnerLeaderboardData = await LeaderboardSchema.findOne({
                        User: uId,
                        Guild: interaction.guild.id
                    })

                    if (!winnerLeaderboardData) winnerLeaderboardData = new LeaderboardSchema({
                        User: uId,
                        Guild: interaction.guild.id
                    })

                    let loserLeaderboardData = await LeaderboardSchema.findOne({
                        User: eId,
                        Guild: interaction.guild.id
                    })

                    if (!loserLeaderboardData) loserLeaderboardData = new LeaderboardSchema({
                        User: eId,
                        Guild: interaction.guild.id
                    })

                    disableButtons(); // Disable all buttons on the board
                    await i.editReply({ content: `<@${u}> won!`, components: [buttons, buttons2, buttons3] });

                    if (!winnerLeaderboardData.Games.Tictactoe.Multiplayer.Win) winnerLeaderboardData.Games.Tictactoe.Multiplayer.Win = 0
                    if (!loserLeaderboardData.Games.Tictactoe.Multiplayer.Lose) loserLeaderboardData.Games.Tictactoe.Multiplayer.Lose = 0

                    winnerLeaderboardData.Games.Tictactoe.Multiplayer.Win += 1
                    loserLeaderboardData.Games.Tictactoe.Multiplayer.Lose += 1

                    await winnerLeaderboardData.save()
                    await loserLeaderboardData.save()

                    return;
                };

                // Check if the game is a tie
                if (checkWinner() === "Tie") {
                    let userLeaderboardData = await LeaderboardSchema.findOne({
                        User: uId,
                        Guild: interaction.guild.id
                    })

                    if (!userLeaderboardData) userLeaderboardData = new LeaderboardSchema({
                        User: uId,
                        Guild: interaction.guild.id
                    })

                    let enemyLeaderboardData = await LeaderboardSchema.findOne({
                        User: eId,
                        Guild: interaction.guild.id
                    })

                    if (!enemyLeaderboardData) enemyLeaderboardData = new LeaderboardSchema({
                        User: eId,
                        Guild: interaction.guild.id
                    })

                    disableButtons(); // Disable all buttons on the board
                    await i.editReply({ content: `It's a tie!`, components: [buttons, buttons2, buttons3] });

                    if (!userLeaderboardData.Games.Tictactoe.Multiplayer.Tie) userLeaderboardData.Games.Tictactoe.Multiplayer.Tie = 0
                    if (!enemyLeaderboardData.Games.Tictactoe.Multiplayer.Tie) enemyLeaderboardData.Games.Tictactoe.Multiplayer.Tie = 0
                    
                    userLeaderboardData.Games.Tictactoe.Multiplayer.Tie += 1
                    enemyLeaderboardData.Games.Tictactoe.Multiplayer.Tie += 1

                    await userLeaderboardData.save()
                    await enemyLeaderboardData.save()

                    return;
                };

                // Prompt for the next move
                let u;
                if (currentPlayer === 'X') { u = eId } else { u = uId };
                i.editReply({ content: `Expires <t:${date2}:R>\nIt's<@${u}>'s turn:`, components: [buttons, buttons2, buttons3] });
                if (currentPlayer === 'X') { currentPlayer = 'O' } else { currentPlayer = 'X' };
            }
        }
    }
}
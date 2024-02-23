const { model, Schema } = require('mongoose')

let LeaderboardSchema = new Schema({
    Guild: String,
    User: String,
    Games: {
        Battleship: {
            Win: Number,
            Lose: Number
        },
        RPSLS: {
            Singleplayer: {
                Win: Number,
                Lose: Number,
                Tie: Number
            },
            Multiplayer: {
                Win: Number,
                Lose: Number,
                Tie: Number
            }
        },
        Tictactoe: {
            Singleplayer: {
                Level1: {
                    Win: Number,
                    Lose: Number,
                    Tie: Number
                },
                Level2: {
                    Win: Number,
                    Lose: Number,
                    Tie: Number
                },
                Level3: {
                    Win: Number,
                    Lose: Number,
                    Tie: Number
                }
            },
            Multiplayer: {
                Win: Number,
                Lose: Number,
                Tie: Number
            }
        }
    }
})

module.exports = model('Leaderboard', LeaderboardSchema)
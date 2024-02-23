# Bot NTTS
## Description
We made this bot with the intention to create some minigames that are not so famous on Discord or are in a very few bots.<br />
The Rock Paper Scissors Lizard Spock minigame is a modified version of the common Rock Paper Scissors with the addition of Lizard and Spock, the original idea was taken from [The Big Bang Theory](https://www.imdb.com/title/tt2220955/characters/nm0101152).<br />
The Tic Tac Toe minigame is the classic minigame with the addition of 3 levels of difficulty against the bot (easy = `1`, medium = `2`, hard = `3`).<br />
The Battleship minigame is the classic battleship.<br />
Whenever a user plays a minigame, the bot records if they won, lost or tied, those data are then displayed in a leaderboard on the `/leaderboard` command

## Commands
### Rock Paper Scissors Lizard Spock (`/rps-lizard-spock`)
A different version of rock paper scissors.
You can either play against the bot or against another user.

#### The game rules are:
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

(they are also avaible by running `/rps-lizard-spock help:True`

### Battleship (`/battleship`)
Play battleship aganist another user.
The game first asks both users to place their own boat, then starts the game.
During the game the users can view their own board (with enemy's hits) and a board with their own hits (without enemy's boats)

#### The meaning of the emojis in the own board is:
- <span><img src="/assets/water.png" width="20" style="vertical-align: middle;"></span> - Water without a hit
- <span><img src="/assets/water_miss.png" width="20" style="vertical-align: middle;"></span> - Water with an enemy missed hit
- <span><img src="/assets/ship.png" width="20" style="vertical-align: middle;"></span> - Ship without a hit
- <span><img src="/assets/ship_hit.png" width="20" style="vertical-align: middle;"></span> - Ship hit by the enemy

#### The meaning of the emojis in the hits board is:
- <span><img src="/assets/water.png" width="20" style="vertical-align: middle;"></span> - Water wirthout a hit
- <span><img src="/assets/water_miss.png" width="20" style="vertical-align: middle;"></span> - Water with a own missed hit
- <span><img src="/assets/water_hit.png" width="20" style="vertical-align: middle;"></span> - Water with an own successful hit

these are also avaible in the correspoding board before the board
all the used emojis are also avaible in the [/assets](/assets) folder

### Tic Tac Toe (`/tictactoe`)
Desc

### Leaderboard (`/leaderboard`)
Shows the server leaderboard of wins, ties or loses in the selected game

# Hosting

### Download the bot
1. `git clone https://github.com/Stef-00012/bot-ntts`
2. `cd bot-ntts`

### Configure the bot
The configuration file is `config.json`, in there you **must** chnage those options
- `token`: The token of your bot (obtained through [Discord's Developer Portal](https://discord.com/developers)
- `mongo`: your MongoDB connection string

### Start the bot
To start the bot just run the command `npm start` in the same folder

# Credits
- `tictactoe` (Tic Tac Toe)
  - Idea: [Ciao287](https://github.com/Ciao287)
  - Code: [Ciao287](https://github.com/Ciao287)
- `rps-lizard-spock` (Rock Paper Scissors Lizard Spock)
  - Idea: [Ciao287](https://github.com/Ciao287)
  - Code: [Stef-00012](https://github.com/Stef-00012)
- `battleship`
  - Idea: [Ciao287](https://github.com/Ciao287)
  - Code: [Stef-00012](https://github.com/Stef-00012)
- `leaderboard`
  - Idea: [Stef-00012](https://github.com/Stef-00012)
  - Code: [Stef-00012](https://github.com/Stef-00012)

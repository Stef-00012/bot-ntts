# bot-ntts
## Description
desc

## Commands
### Rock Paper Scissors Lizard Spock
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

### Battleship
Play battleship aganist another user.
The game first asks both users to place their own boat, then starts the game.
During the game the users can view their own board (with enemy's hits) and a board with their own hits (without enemy's boats)

#### The meaning of the emojis in the own board is:
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/b5c4056c-0ae4-455b-ab99-cdf69b037c03" width="20" style="vertical-align: middle;"></span> - Water without a hit
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/aef77659-9a38-4b92-b129-a2ed204bc319" width="20" style="vertical-align: middle;"></span> - Water with an enemy missed hit
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/09b141d4-7084-4017-a06e-8c32da103daf" width="20" style="vertical-align: middle;"></span> - ship without a hit
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/6447a624-9cc4-4252-9284-0d15583afd00" width="20" style="vertical-align: middle;"></span> - Ship hit by the enemy

#### The meaning of the emojis in the hits board is:
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/b5c4056c-0ae4-455b-ab99-cdf69b037c03" width="20" style="vertical-align: middle;"></span> - Water wirthout a hit
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/aef77659-9a38-4b92-b129-a2ed204bc319" width="20" style="vertical-align: middle;"></span> - Water with a own missed hit
- <span><img src="https://github.com/Stef-00012/bot-ntts/assets/81536172/8411bf1b-e5e4-45ae-b6da-cfdba69d8fc4" width="20" style="vertical-align: middle;"></span> - Water with an own successful hit

these are also avaible in the correspoding board before the board
all the used emojis are also avaible in the [/assets](https://github.com/Stef-00012/bot-ntts/tree/main/assets) folder

### Tic Tac Toe
Desc

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

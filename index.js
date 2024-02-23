process.rootDir = __dirname;

const config = require("./config.json");
const {
    loadEvents,
    loadCommands
} = require('./Handlers/Loader.js');
const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection
} = require('discord.js');

const {
    Guilds,
    GuildMembers,
    GuildMessages,
    MessageContent,
    // GuildEmojisAndStickers,
    // GuildIntegrations,
    // GuildWebhooks,
    // GuildInvites,
    // GuildVoiceStates,
    // GuildPresences,
    // GuildMessageReactions,
    // GuildMessageTyping,
    // DirectMessages,
    // DirectMessageReactions,
    // DirectMessageTyping,
    // GuildScheduledEvents,
    // AutoModerationConfiguration,
    // AutoModerationExecution
} = GatewayIntentBits
const {
    User,
    Channel,
    Message,
    Reaction,
    // GuildMember,
    // GuildScheduledEvent,
    // ThreadMember
} = Partials

const client = new Client({
    intents: [
        Guilds,
        GuildMembers,
        GuildMessages,
        MessageContent,
        
        // GuildModeration,
        // GuildEmojisAndStickers,
        // GuildIntegrations,
        // GuildWebhooks,
        // GuildInvites,
        // GuildVoiceStates,
        // GuildMessageReactions,
        // GuildScheduledEvents,
        // AutoModerationConfiguration,
        // DirectMessages,
        // DirectMessageReactions,
        // GuildPresences,
        // GuildMessageTyping,
        // DirectMessageTyping,
        // AutoModerationExecution,
    ],
    partials: [
        Channel,
        Reaction,
        Message,
        User,
        
        // GuildMember,
        // GuildScheduledEvent,
        // ThreadMember,
    ]
});

client.commands = new Collection()
client.games = new Collection()

process.on('exit', () => {

});

process.on('SIGINT', () => {
    process.exit()
});

process.on('SIGTERM', () => {
    process.exit()
});

process.on('uncaughtException', (error) => {
    console.log(error)
});

process.on('unhandledRejection', (error) => {
    console.log(error)
})

client.login(config.token).then(() => {
    loadEvents(client);
    loadCommands(client);
});
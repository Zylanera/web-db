const { clientId, token } = require("./env/config.json");
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./modules/commandHandler');
const { loadEvents } = require('./modules/eventHandler');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

console.log(` `);
console.log(`=== DCB CHECK ===`);
loadCommands(client);
loadEvents(client);
console.log(`=== DCB CHECK ===`);
console.log(` `);

client.login(token)

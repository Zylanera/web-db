const fs = require('node:fs');
const path = require('node:path');

/**
 * Lädt Befehle aus den Command-Dateien.
 * @param {Client} client - Der Discord.js-Client.
 */
function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Command geladen: ${command.data.name}`);
            } else {
                console.warn(`⚠️ Der Command in ${filePath} fehlt "data" oder "execute".`);
            }
        }
    }
}

module.exports = { loadCommands };

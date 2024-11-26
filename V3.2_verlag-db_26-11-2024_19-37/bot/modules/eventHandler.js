const fs = require('node:fs');
const path = require('node:path');

/**
 * Lädt Events aus den Event-Dateien.
 * @param {Client} client - Der Discord.js-Client.
 */
function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
            console.log(`✅ Event (einmalig) geladen: ${event.name}`);
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
            console.log(`✅ Event geladen: ${event.name}`);
        }
    }
}

module.exports = { loadEvents };
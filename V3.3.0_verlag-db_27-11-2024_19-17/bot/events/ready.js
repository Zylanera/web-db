const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(` `);
		console.log(`=== DCB LOGIN ===`)
		console.log(`✅ Code 200: OK`);
		console.log(`✅ Code 200: LOGIN SUCCESSFUL`);
		console.log(`=== DCB LOGIN ===`)
		console.log(` `);
	},
};
const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js")
const releaseChannel = "1280231429757735027";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('release')
		.setDescription('Füge einen Release zum Releaseplan hinzu.')
    	.addStringOption(
            option => option.setName('text').setDescription('TEXT - DESCRIPTION').setRequired(true)
        )
    	.addStringOption(
            option => option.setName('footer').setDescription('TEXT - FOOTER').setRequired(false)
        ),

	async execute(interaction, client) {

        if(interaction.member.roles.cache.some(role => role.id === '1216440934225416323')) {
            const text = interaction.options.getString("text").split('\\n').join('\n');
        	const footer = interaction.options.getString("footer");

            const embed = new discord.MessageEmbed()
            	embed.setColor("WHITE")
            	embed.setTitle("Ein neuer Release steht fest.")
        		embed.setDescription(`${text}`)
				embed.setTimestamp()
        
        	if(footer) {
        			embed.setFooter(footer)
            } else if(!footer) {
            	    embed.setFooter("Have a nice Day :D")
            };
            
            const embed2 = new discord.MessageEmbed()
                .setColor("GREEN")
                .setTitle("Der Release wurde angekündigt.")
                .setTimestamp()

            interaction.reply({embeds:[embed2], ephemeral: true});
			client.channels.cache.find(channel => channel.id === releaseChannel).send({embeds: [embed]});
        }
	},
};
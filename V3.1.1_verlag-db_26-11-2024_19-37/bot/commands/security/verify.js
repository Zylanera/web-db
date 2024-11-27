const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verify')
		.setDescription('Verifiziere dich'),

	async execute(interaction, client) {

        if(interaction.member.roles.cache.some(role => role.id === '1216441151389958206')) {

            const embed = new discord.MessageEmbed()
                .setColor("RED")
                .setTitle("⚠️ [ERROR]] ⚠️")
                .setDescription(`Du bist bereits verifiziert.`)
                .setTimestamp()
                .setFooter(`Bei Fragen wende dich bitte an @sweety.vin`)

            interaction.reply({embeds:[embed], ephemeral: true})


        } else {

            const embed = new discord.MessageEmbed()
                .setColor("GREEN")
                .setTitle("Verifizierung abgeschlossen.")
                .setTimestamp()
                .setFooter("Wir wünschen viel Spaß <3")

            interaction.member.roles.add("1216441151389958206");
            interaction.reply({embeds:[embed], ephemeral: true})

        };
	},
};

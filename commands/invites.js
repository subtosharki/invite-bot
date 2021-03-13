const Discord = require('discord.js');
const config = require('../storage/config.json');
const index = require('../index.js');
const bot = index.bot;
const cache = require('../storage/cache.json');
const leaves = require('../storage/leaves.json');

module.exports = {
  name: "invites",
  execute: (message, args) => {

    var leav;
    let member = message.mentions.members.first();

    if(!args[0]) {

      if(!cache[message.author.id]) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: You don't have any invites.`));
      if(!leaves[message.author.id]) var leav = 0;
      if(leaves[message.author.id]) var leav = leaves[message.author.id].count;

      let embed = new Discord.RichEmbed()
      .setTitle(`${message.author.username}'s Invites`)
      .setThumbnail(message.author.displayAvatarURL)
      .addField(`Real`, cache[message.author.id].invites)
      .addField(`Fake`, cache[message.author.id].fake)
      .addField(`Leaves`, leav)
      .setColor(config.color);

      message.channel.send(embed);
      return;
    }

    if(args[0]) {

      if(!member) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: **Usage**: \`${config.prefix}invites @user\``));
      if(!cache[member.user.id]) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`**${member.user.tag}** does not have any invites.`));
      if(!leaves[member.user.id]) var leav = 0;
      if(leaves[member.user.id]) var leav = leaves[member.user.id].count;

      let embed = new Discord.RichEmbed()
      .setTitle(`${member.user.username}'s Invites`)
      .setThumbnail(member.user.displayAvatarURL)
      .addField(`Real`, cache[member.user.id].invites)
      .addField(`Fake`, cache[member.user.id].fake)
      .addField(`Leaves`, leav)
      .setColor(config.color);

      message.channel.send(embed);
    }
  }
}

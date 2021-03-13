const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const ms = require("ms");
const cache = require("./storage/cache.json");
const leaves = require("./storage/leaves.json");
const config = require('./storage/config.json');
const prefix = config.prefix;
const chalk = require("chalk");
const date = require('date-and-time');

exports.bot = bot;
bot.commands = new Discord.Collection();

bot.on('error', console.error);

const invites = {};

// Bot isEnabled
bot.on('ready', async () => {

  try {

    var interval = setInterval (function () {
      bot.guilds.forEach(g => {
        g.fetchInvites().then(guildInvites => {
          invites[g.id] = guildInvites;
          console.log(chalk.white(`[${chalk.cyan(`THREAD`)}${chalk.white(`] - Invites cache refreshed`)}`));
        });
      });
    }, 1 * 5000);

    // Command Handler
    const commandFiles = fs.readdirSync("./commands");
    commandFiles.forEach((file) => {
      const command = require(`./commands/${file}`);
      bot.commands.set(command.name, command);
    });

    setTimeout(async function() {
      console.log(chalk.white(`[${chalk.green(`INFO`)}${chalk.white(`] - Connecting...`)}`));
    }, ms('1s'));
    setTimeout(async function() {
      console.log(chalk.white(`[${chalk.green(`INFO`)}${chalk.white(`] - Logged in as: ${bot.user.tag}`)}`));
    }, ms('3s'));
    setTimeout(async function() {
      console.log("");
    }, ms('3s'));

  } catch(e) {

    console.log(chalk.red(`${e.stack}`));
  }
});


bot.on('guildMemberAdd', async member => {

  const logs = member.guild.channels.find(channel => channel.name === config.invite_log);
  if(!logs) return console.log(chalk.red(`[ERROR] - Could not find the (#${config.invite_log}) channel. Please create it or redefine it.`));

  await member.guild.fetchInvites().then(async guildInvites => {

    const ei = invites[member.guild.id];
    if(!ei) return;

    invites[member.guild.id] = guildInvites;

    const invite = await guildInvites.find(i => ei.get(i.code).uses < i.uses);
    const inviter = bot.users.get(invite.inviter.id);

    if(inviter.id === member.id) return;

    if(!cache[inviter.id]) {

      cache[inviter.id] = {
        invr: "Unknown",
        invites: 0,
        fake: 0
      }

      fs.writeFileSync('./storage/cache.json', JSON.stringify(cache));
    }

    let udate = date.format(member.user.createdAt, 'YYYY');
    let now = date.format(new Date(), 'YYYY');

    let res = now - udate;
    console.log(res)

    cache[member.user.id] = {
      invr: inviter.id,
      invites: 0,
      fake: 0
    }

    if(res <= 1) {

      cache[inviter.id].fake = cache[inviter.id].fake + 1;

      fs.writeFileSync('./storage/cache.json', JSON.stringify(cache));

      let embed = new Discord.RichEmbed()
      .setAuthor(`${bot.user.username}`, member.user.displayAvatarURL)
      .setDescription(`Welcome ${member.user} to **${member.guild.name}**!`)
      .addField(`Invited By`, inviter.tag, true)
      .addField(`Invite Used`, `\`${invite.code}\` | Used: ${invite.uses}`, true)
      .setColor(config.color);

      logs.send(embed);
      return;
    }

    cache[inviter.id].invites = cache[inviter.id].invites + 1;

    fs.writeFileSync('./storage/cache.json', JSON.stringify(cache));

    let embed = new Discord.RichEmbed()
    .setAuthor(`${bot.user.username}`, member.user.displayAvatarURL)
    .setDescription(`Welcome ${member.user} to **${member.guild.name}**!`)
    .addField(`Invited By`, inviter.tag, true)
    .addField(`Invite Used`, `\`${invite.code}\` | Used: ${invite.uses}`, true)
    .setColor(config.color);

    logs.send(embed);

  });
});

bot.on('guildMemberRemove', member => {

  const logs = member.guild.channels.find(channel => channel.name === config.invite_log);
  if(!logs) return console.log(chalk.red(`[ERROR] - Could not find the (#${config.invite_log}) channel. Please create it or redefine it.`));

  if(leaves[member.user.id]) {

    delete leaves[member.user.id];
    delete cache[member.user.id];

    fs.writeFileSync('./storage/leaves.json', JSON.stringify(leaves));
    fs.writeFileSync('./storage/cache.json', JSON.stringify(cache));
    return;
  }

  let db = cache[member.user.id];
  if(!db) return;

  let i = db.invr;
  let idb = leaves[i];

  if(cache[i].invites != 0) {

    cache[i].invites = cache[i].invites - 1;
  }

  if(!idb) {

    leaves[i] = {
      count: 1
    }

    delete cache[member.user.id];
    fs.writeFileSync('./storage/cache.json', JSON.stringify(cache));
    fs.writeFileSync('./storage/leaves.json', JSON.stringify(leaves));

    logs.send(`**${member.user.tag}** has left; Invited by <@${i}>`);
    return;
  }

  idb.count = idb.count + 1;
  delete cache[member.user.id];

  fs.writeFileSync('./storage/leaves.json', JSON.stringify(leaves));
  fs.writeFileSync('./storage/cache.json', JSON.stringify(cache));

  logs.send(`**${member.user.tag}** has left; Invited by <@${i}>`);
  return;
});

// Message Listener
bot.on("message", async(message) => {

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift();

  if (message.channel.type != "text") return;
  if (message.author.bot) return;

  if (message.author.bot && message.content.startsWith(prefix)) return;
  if (!message.content.startsWith(prefix)) return;

  let cmd = bot.commands.get(command.toLowerCase());
  if (cmd) cmd.execute(message,args);
});

fs.readdir("./events/", (async function (err, files) {
  let jsfile = files.filter(f => f.split(".").pop() === "js");
  
  jsfile.forEach(file => {
    const event = new(require(`./events/${file}`))(client);
  
    client.on(eventName, (...args) => event.run(...args));
    const mod = require.cache[require.resolve(`./events/${file}`)];
    delete require.cache[require.resolve(`./events/${file}`)];
    const index = mod.parent.children.indexOf(mod);
    if (index !== -1) mod.parent.children.splice(index, 1);
  });
}))

bot.login(config.token);

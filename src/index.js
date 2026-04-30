require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const { execFile } = require('child_process');

setInterval(() => {
  console.log('🔄 Renovando cookies...');
  execFile('node', ['update-cookies.js'], (err) => {
    if (err) console.error('Erro ao renovar cookies:', err);
    else console.log('✅ Cookies renovados!');
  });
}, 6 * 60 * 60 * 1000); // a cada 6 horas

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
client.queues = new Map(); // fila por servidor

// Carrega os comandos
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.name, command);
});

client.on('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('❌ Ocorreu um erro ao executar o comando.');
  }
});

client.login(process.env.DISCORD_TOKEN);
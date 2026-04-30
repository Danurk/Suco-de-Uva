const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');
const { execFile } = require('child_process');
const path = require('path');
const { getQueue, playSong } = require('../utils/musicPlayer');

const ytdlpPath = path.join(process.cwd(), 'yt-dlp.exe');
const cookiesPath = path.join(process.cwd(), 'cookies.txt');

function searchYtdlp(query) {
  return new Promise((resolve, reject) => {
    const isUrl = query.startsWith('http');
    const args = isUrl
      ? ['--dump-json', '--no-playlist', '--cookies', cookiesPath, query]
      : ['--dump-json', '--no-playlist', '--cookies', cookiesPath, `ytsearch1:${query}`];

    execFile(ytdlpPath, args, (err, stdout) => {
      if (err) return reject(err);
      try {
        const info = JSON.parse(stdout.trim());
        resolve({ title: info.title, url: info.webpage_url });
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = {
  name: 'play',
  async execute(message, args, client) {
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) return message.reply('🔇 Você precisa estar em um canal de voz!');
    if (!args.length) return message.reply('❓ Use: `!play <nome ou URL>`');

    const query = args.join(' ');
    let songInfo;

    try {
      songInfo = await searchYtdlp(query);
    } catch (e) {
      console.error(e);
      return message.reply('❌ Erro ao buscar a música.');
    }

    const queue = getQueue(message.guild.id, client);
    queue.songs.push(songInfo);

    if (!queue.connection) {
      queue.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);
      playSong(queue, message, client);
    } else {
      message.reply(`✅ **${songInfo.title}** adicionada à fila!`);
    }
  },
};
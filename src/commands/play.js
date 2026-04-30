const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');
const { execFile } = require('child_process');
const path = require('path');
const { getQueue, playSong } = require('../utils/musicPlayer');

const ytdlpPath = '/usr/local/bin/yt-dlp';
const cookiesPath = path.join(process.cwd(), 'cookies.txt');

function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, [
      '--dump-json',
      '--no-playlist',
      '--cookies', cookiesPath,
      url
    ], (err, stdout) => {
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

function getPlaylistInfo(url) {
  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, [
      '--dump-json',
      '--flat-playlist',
      '--cookies', cookiesPath,
      url
    ], (err, stdout) => {
      if (err) return reject(err);
      try {
        const songs = stdout.trim().split('\n').map(line => {
          const info = JSON.parse(line);
          return {
            title: info.title,
            url: `https://www.youtube.com/watch?v=${info.id}`
          };
        });
        resolve(songs);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function searchYtdlp(query) {
  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, [
      '--dump-json',
      '--no-playlist',
      '--cookies', cookiesPath,
      `ytsearch1:${query}`
    ], (err, stdout) => {
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
    if (!args.length) return message.reply('❓ Use: `!play <nome ou URLs>`');

    // Separa os argumentos em URLs e busca de texto
    const urls = args.filter(a => a.startsWith('http'));
    const textQuery = args.filter(a => !a.startsWith('http')).join(' ');

    let songs = [];

    try {
      // Processa URLs
      for (const url of urls) {
        if (url.includes('list=')) {
          message.reply(`⏳ Carregando playlist...`);
          const playlistSongs = await getPlaylistInfo(url);
          songs.push(...playlistSongs);
          message.reply(`✅ **${playlistSongs.length} músicas** adicionadas à fila!`);
        } else {
          const song = await getVideoInfo(url);
          songs.push(song);
        }
      }

      // Processa busca de texto
      if (textQuery) {
        const song = await searchYtdlp(textQuery);
        songs.push(song);
      }
    } catch (e) {
      console.error(e);
      return message.reply('❌ Erro ao buscar a música.');
    }

    if (!songs.length) return message.reply('❌ Nenhuma música encontrada.');

    const queue = getQueue(message.guild.id, client);
    const wasEmpty = queue.songs.length === 0;

    queue.songs.push(...songs);

    if (!queue.connection) {
      queue.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);
      playSong(queue, message, client);
    } else if (wasEmpty) {
      playSong(queue, message, client);
    } else if (songs.length === 1) {
      message.reply(`✅ **${songs[0].title}** adicionada à fila!`);
    }
  },
};

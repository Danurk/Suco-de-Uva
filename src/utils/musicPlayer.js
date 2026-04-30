const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');

const ytdlpPath = path.join(process.cwd(), 'yt-dlp.exe');
const cookiesPath = path.join(process.cwd(), 'cookies.txt');

function getQueue(guildId, client) {
  if (!client.queues.has(guildId)) {
    client.queues.set(guildId, { songs: [], player: null, connection: null });
  }
  return client.queues.get(guildId);
}

async function playSong(queue, message, client) {
  if (queue.songs.length === 0) {
    queue.connection?.destroy();
    client.queues.delete(message.guild.id);
    return;
  }

  const song = queue.songs[0];

  try {
    const ytdlp = spawn(ytdlpPath, [
      '-f', 'bestaudio',
      '-o', '-',
      '--quiet',
      '--cookies', cookiesPath,
      song.url
    ]);

    // Salva o processo na fila para poder matar depois
    queue.currentProcess = ytdlp;

    ytdlp.stderr.on('data', (data) => {
      const msg = data.toString();
      if (!msg.includes('Broken pipe')) {
        console.error('yt-dlp erro:', msg);
      }
    });

    ytdlp.on('error', () => {}); // ignora erros de pipe

    const resource = createAudioResource(ytdlp.stdout);
    queue.player.play(resource);
    message.channel.send(`🎵 Tocando agora: **${song.title}**`);

    queue.player.once(AudioPlayerStatus.Idle, () => {
      queue.songs.shift();
      playSong(queue, message, client);
    });
  } catch (error) {
    console.error('Erro ao tocar:', error);
    message.channel.send('❌ Erro ao tocar a música. Pulando...');
    queue.songs.shift();
    playSong(queue, message, client);
  }
}

module.exports = { getQueue, playSong };
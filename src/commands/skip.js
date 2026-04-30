module.exports = {
  name: 'skip',
  async execute(message, args, client) {
    const queue = client.queues.get(message.guild.id);
    if (!queue || !queue.songs.length) return message.reply('❌ Nenhuma música tocando.');
    
    // Mata o processo do yt-dlp antes de pular
    if (queue.currentProcess) {
      queue.currentProcess.kill();
      queue.currentProcess = null;
    }
    
    queue.player.stop();
    message.reply('⏭️ Música pulada!');
  },
};
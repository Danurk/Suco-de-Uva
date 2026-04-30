module.exports = {
  name: 'stop',
  async execute(message, args, client) {
    const queue = client.queues.get(message.guild.id);
    if (!queue) return message.reply('❌ Nenhuma música tocando.');
    queue.songs = [];
    queue.player?.stop();
    queue.connection?.destroy();
    client.queues.delete(message.guild.id);
    message.reply('⏹️ Música parada e fila limpa!');
  },
};
module.exports = {
  name: 'queue',
  async execute(message, args, client) {
    const queue = client.queues.get(message.guild.id);
    if (!queue || !queue.songs.length) return message.reply('📭 A fila está vazia.');
    const list = queue.songs.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
    message.reply(`🎶 **Fila:**\n${list}`);
  },
};
// deploy-commands.js
// Bu dosyayı sadece komutları (yeniden) kaydetmek için 'node deploy-commands.js' diyerek çalıştırın.

const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
require('dotenv').config(); // .env dosyasındaki değişkenleri yükler

const commands = [
    // 1. Yazı Tura Komutu
    new SlashCommandBuilder()
        .setName('yazi-tura')
        .setDescription('Bot sizin için bir para atar.'),

    // 2. Taş-Kağıt-Makas Komutu
    new SlashCommandBuilder()
        .setName('tkm')
        .setDescription('Bir üyeye karşı TKM oynarsınız.')
        .addUserOption(option =>
            option.setName('rakip')
                .setDescription('Düello yapmak istediğiniz kişi.')
                .setRequired(true)),

    // 3. Anlık Su Hatırlatması
    new SlashCommandBuilder()
        .setName('su-ic')
        .setDescription('Sohbete anlık su içme hatırlatması gönderir.')
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Gönderilecek özel mesaj (Opsiyonel)')
                .setRequired(false)),

    // 4. Otomatik Su Hatırlatması Ayarlama
    new SlashCommandBuilder()
        .setName('su-ayarla')
        .setDescription('Otomatik su hatırlatması kurar.')
        .addIntegerOption(option =>
            option.setName('aralik')
                .setDescription('Hatırlatma arasındaki süre (sayı olarak).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('birim')
                .setDescription('Zaman birimi (dakika veya saat).')
                .setRequired(true)
                .addChoices(
                    { name: 'Dakika', value: 'dakika' },
                    { name: 'Saat', value: 'saat' }
                ))
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Hatırlatmanın yapılacağı kanal.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Gönderilecek özel hatırlatma mesajı (Opsiyonel)')
                .setRequired(false)),
    
    // 5. Otomatik Su Hatırlatmayı Durdurma
    new SlashCommandBuilder()
        .setName('su-durdur')
        .setDescription('Kurulu otomatik su hatırlatmasını durdurur.'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('(/) Slash komutları kaydedilmeye başlanıyor...');

        await rest.put(
            // NOT: Sunucu ID'sini .env dosyanıza eklemeyi unutmayın!
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('(/) Slash komutları başarıyla kaydedildi.');
    } catch (error) {
        console.error(error);
    }
})();
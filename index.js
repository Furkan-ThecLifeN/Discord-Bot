// index.js (TKM Sonuçlarına devre dışı butonlar eklendi)

const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Sunucu bazlı su hatırlatma zamanlayıcılarını saklamak için bir Map
const guildTimers = new Map();

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
});

client.on('interactionCreate', async interaction => {

    // --- TKM Buton Etkileşimi ---
    if (interaction.isButton()) {
        const [action, player1Id, player2Id] = interaction.customId.split('_');

        // Sadece TKM butonlarıysa devam et
        if (!['tkm-tas', 'tkm-kagit', 'tkm-makas'].includes(action)) return;

        const player1 = await client.users.fetch(player1Id);
        const player2 = await client.users.fetch(player2Id);

        // Oyuncu olmayan biri butona basarsa
        if (interaction.user.id !== player1Id && interaction.user.id !== player2Id) {
            return interaction.reply({ content: 'Bu düello seni ilgilendirmiyor!', ephemeral: true });
        }

        // TKM oyunlarını saklamak için (geçici)
        if (!client.tkmGames) client.tkmGames = new Map();
        
        const gameId = interaction.message.id;
        let gameData = client.tkmGames.get(gameId) || { choices: {} };

        // Oyuncu zaten seçim yapmış mı?
        if (gameData.choices[interaction.user.id]) {
            return interaction.reply({ content: 'Zaten bir seçim yaptın! Rakibini bekle.', ephemeral: true });
        }

        // Seçimi kaydet
        gameData.choices[interaction.user.id] = action.split('-')[1]; // 'tas', 'kagit', 'makas'
        client.tkmGames.set(gameId, gameData);

        const choiceText = {
            'tas': 'Taş 🗿',
            'kagit': 'Kağıt 📄',
            'makas': 'Makas ✂️'
        };

        // Bu gizli mesaj (ephemeral) hemen gönderilecek
        await interaction.reply({ content: `Seçimin: **${choiceText[gameData.choices[interaction.user.id]]}**. Rakibin bekleniyor...`, ephemeral: true });

        // İki oyuncu da seçim yaptı mı?
        if (Object.keys(gameData.choices).length === 2) {
            const choice1 = gameData.choices[player1Id];
            const choice2 = gameData.choices[player2Id];
            let resultText = '';
            let winner = null;

            if (choice1 === choice2) {
                resultText = `**Berabere!** İki taraf da ${choiceText[choice1]} seçti.`;
            } else if (
                (choice1 === 'tas' && choice2 === 'makas') ||
                (choice1 === 'kagit' && choice2 === 'tas') ||
                (choice1 === 'makas' && choice2 === 'kagit')
            ) {
                winner = player1;
                resultText = `🏆 Kazanan: **${player1.username}**`;
            } else {
                winner = player2;
                resultText = `🏆 Kazanan: **${player2.username}**`;
            }

            // Butonları devre dışı bırak
            const disabledButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('disabled_t').setLabel('Taş 🗿').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('disabled_k').setLabel('Kağıt 📄').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('disabled_m').setLabel('Makas ✂️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                );
            
            // Sonuç Embed'i
            const resultEmbed = new EmbedBuilder()
                .setTitle('⚔️ Düello Sonuçlandı! ⚔️')
                .setDescription(resultText)
                .addFields(
                    { name: player1.username, value: choiceText[choice1], inline: true },
                    { name: player2.username, value: choiceText[choice2], inline: true }
                )
                .setColor(winner ? 'Green' : 'Yellow')
                .setTimestamp();

            // Orijinal davet mesajını düzenle: Başlığı değiştir ve butonları kapat
            // Bu, oyunun bittiğini gösterir.
            const originalEmbed = interaction.message.embeds[0];
            const finishedEmbed = new EmbedBuilder(originalEmbed.toJSON()) // Davet embed'ini kopyala
                .setTitle('⚔️ TKM Düellosu Tamamlandı ⚔️')
                .setDescription('Sonuçlar aşağıda açıklandı. Yeni oyun için /tkm kullanın.');

            await interaction.message.edit({ embeds: [finishedEmbed], components: [disabledButtons] });

            // EN ÖNEMLİ DEĞİŞİKLİK:
            // Sonucu, sohbete YENİ BİR MESAJ olarak gönder
            // ve devre dışı bırakılmış butonları da AŞAĞISINA EKLE.
            await interaction.channel.send({ embeds: [resultEmbed], components: [disabledButtons] });

            // Oyunu hafızadan sil
            client.tkmGames.delete(gameId);
        }
    }

    // --- Slash Komut Etkileşimi ---
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // --- 1. Yazı Tura ---
    if (commandName === 'yazi-tura') {
        await interaction.reply({ content: 'Para havaya atılıyor... 🪙' });
        const sonuc = Math.random() < 0.5 ? 'YAZI' : 'TURA';
        
        setTimeout(async () => {
            await interaction.editReply(`Para havaya atıldı... 🪙 ve sonuç: **${sonuc}!**`);
        }, 1500);
    }

    // --- 2. TKM (Taş-Kağıt-Makas) ---
    else if (commandName === 'tkm') {
        const player1 = interaction.user;
        const player2 = interaction.options.getUser('rakip');

        if (player1.id === player2.id) {
            return interaction.reply({ content: 'Kendine karşı oynayamazsın!', ephemeral: true });
        }
        if (player2.bot) {
            return interaction.reply({ content: 'Botlara karşı oynayamazsın!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚔️ TKM Düellosuna Davet! ⚔️')
            .setDescription(`${player1} kullanıcısı, ${player2} kullanıcısını TKM oynamaya davet etti!

Lütfen **sadece siz görebileceğiniz** aşağıdaki butonlardan seçiminizi yapın. (Süre: 60 Saniye)`)
            .setColor('Blue')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`tkm-tas_${player1.id}_${player2.id}`)
                    .setLabel('Taş 🗿')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`tkm-kagit_${player1.id}_${player2.id}`)
                    .setLabel('Kağıt 📄')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`tkm-makas_${player1.id}_${player2.id}`)
                    .setLabel('Makas ✂️')
                    .setStyle(ButtonStyle.Primary),
            );

        const gameMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Zaman aşımı yönetimi (60 saniye)
        setTimeout(async () => {
            if (client.tkmGames && client.tkmGames.has(gameMessage.id)) {
                
                const disabledButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('disabled_t').setLabel('Taş 🗿').setStyle(ButtonStyle.Secondary).setDisabled(true),
                        new ButtonBuilder().setCustomId('disabled_k').setLabel('Kağıt 📄').setStyle(ButtonStyle.Secondary).setDisabled(true),
                        new ButtonBuilder().setCustomId('disabled_m').setLabel('Makas ✂️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    );

                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('🚫 Düello İptal Edildi 🚫')
                    .setDescription('Oyun 60 saniye içinde tamamlanmadığı için zaman aşımına uğradı.')
                    .setColor('Red');

                await gameMessage.edit({ embeds: [timeoutEmbed], components: [disabledButtons] });
                client.tkmGames.delete(gameMessage.id);
            }
        }, 60000);
    }

    // --- 3. Anlık Su Hatırlatması ---
    else if (commandName === 'su-ic') {
        const ozelMesaj = interaction.options.getString('mesaj');
        const mesaj = ozelMesaj || "Su içiniz";

        await interaction.channel.send(`@everyone 💧 ${mesaj}`);
        await interaction.reply({ content: 'Hatırlatma gönderildi!', ephemeral: true });
    }

    // --- 4. Otomatik Su Hatırlatması Ayarlama ---
    else if (commandName === 'su-ayarla') {
        const aralik = interaction.options.getInteger('aralik');
        const birim = interaction.options.getString('birim');
        const kanal = interaction.options.getChannel('kanal');
        const ozelMesaj = interaction.options.getString('mesaj');
        const mesaj = ozelMesaj || "Otomatik Hatırlatma: Su içme vakti!";

        let sureMs = 0;
        if (birim === 'dakika') {
            sureMs = aralik * 60 * 1000;
        } else if (birim === 'saat') {
            sureMs = aralik * 60 * 60 * 1000;
        }

        if (sureMs < 60000) {
            return interaction.reply({ content: 'Hata: Zaman aralığı en az 1 dakika olmalıdır.', ephemeral: true });
        }

        const guildId = interaction.guild.id;

        if (guildTimers.has(guildId)) {
            clearInterval(guildTimers.get(guildId));
            guildTimers.delete(guildId);
        }

        const newInterval = setInterval(async () => {
            try {
                const targetChannel = await client.channels.fetch(kanal.id);
                if (targetChannel) {
                    await targetChannel.send(`@everyone 💧 ${mesaj}`);
                }
            } catch (err) {
                console.error("Otomatik su hatırlatma hatası:", err);
                clearInterval(newInterval);
                guildTimers.delete(guildId);
            }
        }, sureMs);

        guildTimers.set(guildId, newInterval);

        await interaction.reply({ 
            content: `✅ Otomatik su hatırlatması kuruldu. \`${kanal.name}\` kanalına her **${aralik} ${birim}** içinde bildirim gönderilecek.`, 
            ephemeral: true 
        });
    }

    // --- 5. Otomatik Su Hatırlatmayı Durdurma ---
    // deploy-commands.js dosyanızda 'su-durdur' yazdığınızı varsayıyorum.
    else if (commandName === 'su-durdur') { 
        const guildId = interaction.guild.id;

        if (guildTimers.has(guildId)) {
            clearInterval(guildTimers.get(guildId));
            guildTimers.delete(guildId);
            await interaction.reply({ content: '🚫 Otomatik su hatırlatması durduruldu.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Zaten kurulu bir otomatik hatırlatma yok.', ephemeral: true });
        }
    }
});

app.get('/', (req, res) => res.send('Bot aktif 🚀'));
app.listen(PORT, () => console.log(`Render port ${PORT} üzerinde dinliyor...`));

client.login(process.env.DISCORD_TOKEN);

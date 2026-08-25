const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Mfana Tech Bot ipo LIVE na tayari kupokea wateja! 🚀');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages;
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!textMessage) return;
        const cleanText = textMessage.trim().toLowerCase();

        console.log(`Meseji kutoka kwa mteja (${remoteJid}): ${textMessage}`);

        // CONVERSATION FLOW - MFANA TECH INFRASTRUCTURE
        if (cleanText === 'mambo' || cleanText === 'habari' || cleanText === 'hello' || cleanText === 'it') {
            await sock.sendMessage(remoteJid, { 
                text: '👋 *Karibu MFANA TECH SOLUTIONS!* \nSisi ni wataalamu wa mifumo ya kompyuta na network nchini Tanzania. 🇹🇿\n\nUngependa tukusaidie nini leo? Jibu kwa kuandika neno miongoni mwa haya:\n\n💻 *HUDUMA* - Kuona mifumo tunayotengeneza.\n📍 *OFISI* - Kujua maeneo tunayopatikana.\n📞 *ONGEA* - Kuongea na mtaalamu wa IT moja kwa moja.' 
            });
        } 
        else if (cleanText === 'huduma') {
            await sock.sendMessage(remoteJid, { 
                text: '🛠️ *HUDUMA ZETU ZA IT:* ✨\n\n1️⃣ *WhatsApp Automation & Chatbots* (Kuongeza mauzo ya biashara yako masaa 24).\n2️⃣ *Custom POS & ERP Systems* (Mifumo ya usimamizi wa maduka na kudhibiti wizi).\n3️⃣ *Network Configuration & Wi-Fi Portals* (Kwa ajili ya mahoteli na maofisi).\n\n_Jibu kwa kuandika namba ya huduma (mfano: 1) ili kupata mchanganuo wa bei na jinsi tunavyofanya._' 
            });
        } 
        else if (cleanText === 'ofisi') {
            await sock.sendMessage(remoteJid, { 
                text: '📍 *MAENEO TUNAYOPATIKANA:* \n\nSisi ni ma-engineer wa IT tunaohama kulingana na miradi ya wateja wetu. Tunafika haraka sana maeneo yafuatayo:\n* Moshi & Arusha (Kanda ya Kaskazini)\n* Dar es Salaam (Kitovu cha Biashara)\n* Zanzibar (Makahazi na Mahoteli ya Utalii)\n\n_Kama una mradi wowote kwenye mikoa hii, andika neno *ONGEA* tukupigie sasa hivi!_' 
            });
        } 
        else if (cleanText === '1') {
            await sock.sendMessage(remoteJid, { 
                text: '🤖 *WhatsApp Automation & Chatbots:*\n\nTunatengeneza chatbot kama hii unayoitumia sasa hivi, inayoweza kusoma bidhaa zako, kujibu wateja automatically, na kuongeza mauzo hata ukiwa umelala.\n\n💰 *Gharama ya Kuanzia:* Tsh 500,000\n⏱️ *Muda wa Kukamilika:* Siku 3 hadi 5.' 
            });
        } 
        else if (cleanText === '2') {
            await sock.sendMessage(remoteJid, { 
                text: '📊 *Custom POS & ERP Systems:*\n\nMifumo ya kisasa ya kompyuta ya kusimamia stoki ya maduka (Hardware, Pharmacy, Supermarkets) na kuunganisha matawi tofauti kupitia Cloud. Inajumuisha na usalama wa database.\n\n💰 *Gharama ya Kuanzia:* Tsh 1,500,000\n⏱️ *Muda wa Kukamilika:* Siku 7 hadi 14.' 
            });
        } 
        else if (cleanText === '3') {
            await sock.sendMessage(remoteJid, { 
                text: '🌐 *Network Configuration & Wi-Fi Portals:*\n\nKusetup router za Mikrotik/Ubiquiti UniFi, kuweka Captive Portal ya hoteli ili kukusanya email za watalii, na ku-shape bandwidth ili intaneti isiwe nzito.\n\n💰 *Gharama ya Kuanzia:* Tsh 800,000\n⏱️ *Muda wa Kukamilika:* Siku 2 hadi 4.' 
            });
        } 
        else if (cleanText === 'ongea') {
            await sock.sendMessage(remoteJid, { 
                text: '📞 *Ombi Lako Limepokelewa!* \nMtaalamu wetu mkuu wa IT (Mfana) ameshapata taarifa. Tafadhali andika namba yako ya simu hapa chini na maelezo mafupi ya mradi wako, atakupigia ndani ya dakika 10. Asante!' 
            });
        } 
        else {
            await sock.sendMessage(remoteJid, { 
                text: '🤖 _Mfana Tech Bot haijatambua neno uliloandika._\n\nTafadhali andika:\n* *HUDUMA* kuona kazi zetu.\n* *OFISI* kujua tunapopatikana.\n* *ONGEA* kuacha namba yako ya simu.' 
            });
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// Mfumo wa kudhibiti makosa (Retry Counter)
let pairingAttempts = 0;
const MAX_ATTEMPTS = 4;
let isCooldown = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false 
    });

    // MFUMO WA PAIRING CODE WENYE COOLDOWN LIMIT
    if (!sock.authState.creds.registered && !isCooldown) {
        // 🔥 BADILISHA HAPA: Weka namba yako ya WhatsApp ya kweli kuanza na 255
        const phoneNumber = "255XXXXXXXXX"; 
        
        setTimeout(async () => {
            if (pairingAttempts >= MAX_ATTEMPTS) {
                console.log(`\n🚨 OLA! Umejaribu mara ${pairingAttempts}. Mfumo unajifunga kwa dakika 5 kulinda namba yako... 🚨\n`);
                isCooldown = true;
                setTimeout(() => {
                    isCooldown = false;
                    pairingAttempts = 0;
                    console.log("🔄 Dakika 5 zimeisha. Inajaribu kuomba Code upya...");
                    connectToWhatsApp();
                }, 300000); // Milisekunde 300,000 ni sawa na dakika 5
                return;
            }

            try {
                pairingAttempts++;
                console.log(`\n🔄 Inajaribu kuomba Code... Jaribio la [${pairingAttempts}/${MAX_ATTEMPTS}]`);
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔥 CODE YAKO YA WHATSAPP NI: ${code} 🔥`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log("⚠️ Imeshindwa kupata pairing code kwa sasa, inajaribu tena...", error.message);
            }
        }, 10000); // Inasubiri sekunde 10 ili seva itulie
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && !sock.authState.creds.registered) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Muunganisho umefungwa. Sababu: ${lastDisconnect?.error?.message}. Reconnect: ${shouldReconnect}`);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            pairingAttempts = 0; // Kazi ikikubali, weka counter iwe 0
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

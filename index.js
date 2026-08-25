const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");

// NB: WEKA NAMBA YAKO YA SIMU HAPA (Anza na 255 bila alama ya +)
const PHONE_NUMBER = "255XXXXXXXXX"; 

async function startBot() {
    // Kusimamia faili za session ili usihitaji kuunganisha kila mara seva ikizima
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    // Kusanidi unganisho la bot
    const sock = makeWASocket({
        logger: pino({ level: "silent" }), // Inazima fujo za log zisizo na mpango
        printQRInTerminal: false,          // INAZIMA kabisa QR Code isitokee kwenye terminal
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"] // Inahitajika ili kufanya pairing code ikubaliwe
    });

    // Amri ya kuomba Pairing Code kama bot haijaunganishwa bado
    if (!sock.authState.creds.registered) {
        // Hakikisha namba ya simu imewekwa vizuri kabla ya kuomba kodi
        if (!PHONE_NUMBER || PHONE_NUMBER === "255XXXXXXXXX") {
            console.log("\n❌ MAKOSA: Tafadhali fungua faili la index.js na uweke namba yako ya simu ya kweli kwenye mstari wa 10!\n");
            process.exit(1);
        }

        await delay(3000); // Subiri sekunde 3 ili mfumo ukae sawa
        try {
            let code = await sock.requestPairingCode(PHONE_NUMBER);
            // Inatenganisha herufi kuwa nne nne ili iwe rahisi kusomeka (mfano: ABCD-EFGH)
            let formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            
            console.log("\n==================================================");
            console.log(`🔥 CODE YAKO YA WHATSAPP NI: ${formattedCode} 🔥`);
            console.log("==================================================\n");
        } catch (error) {
            console.error("❌ Imeshindikana kupata Pairing Code: ", error);
        }
    }

    // Kufuatilia hali ya unganisho (Connection Status)
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(" Unganisho limekatika kutokana na: ", lastDisconnect?.error, ". Inajaribu kuwaka upya: ", shouldReconnect);
            
            if (shouldReconnect) {
                startBot(); // Inawasha upya bot kama haukujitoa mwenyewe (logout)
            }
        } else if (connection === "open") {
            console.log("\n✅ HONGERA! Bot yako ya WhatsApp sasa ipo LIVE na imeunganishwa kikamilifu! 🎉\n");
        }
    });

    // Kuhifadhi mabadiliko ya siri za unganisho (Credentials)
    sock.ev.on("creds.update", saveCreds);

    // Mfano wa kupokea ujumbe na kujibu (Unaweza kuweka kodi zako za bot hapa chini)
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return; // Puuza ujumbe kama umetoka kwako

            const messageType = Object.keys(msg.message)[0];
            const text = messageType === "conversation" ? msg.message.conversation : 
                         messageType === "extendedTextMessage" ? msg.message.extendedTextMessage.text : "";

            const from = msg.key.remoteJid;

            // Mfano rahisi: Mtu akiandika "mambo" bot inajibu "Safi! Nilikuwa nakusubiri."
            if (text.toLowerCase() === "mambo") {
                await sock.sendMessage(from, { text: "Safi! Nilikuwa nakusubiri." }, { quoted: msg });
            }
        } catch (e) {
            console.log("Makosa kwenye kupokea ujumbe: ", e);
        }
    });
}

// Anzisha mfumo mzima
startBot();

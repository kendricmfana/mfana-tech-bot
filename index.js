const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

// 1. WEKA NAMBA YAKO YA SIMU HAPA (Anza na 255)
const PHONE_NUMBER = "255712345678"; 

let isPairingCodeRequested = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Mac OS", "Chrome", "10.0.0"] 
    });

    // Inaleta kodi mara moja tu na inasubiri bila kucrash seva
    if (!sock.authState.creds.registered && !isPairingCodeRequested) {
        isPairingCodeRequested = true;
        await delay(5000); // Subiri sekunde 5 seva itulie
        try {
            let code = await sock.requestPairingCode(PHONE_NUMBER);
            let formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            
            console.log("\n==================================================");
            console.log(`🔥 CODE YAKO MPYA: ${formattedCode} 🔥`);
            console.log("==================================================\n");
        } catch (error) {
            console.error("❌ Hitilafu ya kodi: ", error);
            isPairingCodeRequested = false;
        }
    }

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`⚠️ Unganisho limekatika (Status: ${statusCode}). Inajaribu kuwaka upya...`);
            
            if (shouldReconnect) {
                // Inasubiri sekunde 10 kabla ya kujiwasha upya kuzuia crash loop
                setTimeout(() => startBot(), 10000); 
            }
        } else if (connection === "open") {
            console.log("\n✅ Bot imeunganishwa kikamilifu kwenye WhatsApp! 🎉\n");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message)[0];
            let text = "";
            if (messageType === "conversation") text = msg.message.conversation;
            else if (messageType === "extendedTextMessage") text = msg.message.extendedTextMessage.text;

            const from = msg.key.remoteJid;

            if (text.toLowerCase() === "mambo") {
                await sock.sendMessage(from, { text: "Safi! Nilikuwa nakusubiri." }, { quoted: msg });
            }
        } catch (e) {
            console.log("Makosa kwenye kupokea ujumbe: ", e);
        }
    });
}

// 2. ULINZI WA KICHADHI: Inazuia seva ya Railway isife (isicrash) hata kukiwa na hitilafu yoyote
process.on("unhandledRejection", (reason, p) => {
    console.log("Ulinzi: Imepuuza kosa la unhandledRejection", reason);
});
process.on("uncaughtException", (err) => {
    console.log("Ulinzi: Imepuuza kosa la uncaughtException", err);
});

startBot();

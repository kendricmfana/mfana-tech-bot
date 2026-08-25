const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

// NAMBA YAKO MPYA IMESHAREKEBISHWA HAPA CHINI
const PHONE_NUMBER = "255617383650"; 

let isPairingCodeRequested = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Mac OS", "Chrome", "10.0.0"] 
    });

    if (!sock.authState.creds.registered && !isPairingCodeRequested) {
        isPairingCodeRequested = true;
        await delay(5000); 
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
            
            console.log(`⚠️ Unganisho limekatika. Inajaribu kuwaka upya...`);
            isPairingCodeRequested = false; 
            
            if (shouldReconnect) {
                setTimeout(() => startBot(), 7000); 
            }
        } else if (connection === "open") {
            console.log("\n✅ Bot imeunganishwa kikamilifu kwenye WhatsApp! 🎉\n");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages;
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message);
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

process.on("unhandledRejection", (reason, p) => {});
process.on("uncaughtException", (err) => {});

startBot();

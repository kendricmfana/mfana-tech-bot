const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, 
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("\n==================================================");
            console.log("📸 SCAN QR CODE HII CHINI KUUNGANISHA WHATSAPP 📸");
            console.log("==================================================\n");
            
            // Tumeondoa { small: true } ili kutoa QR Code kubwa na imara kama ya terminal ya PC
            qrcode.generate(qr); 
            
            console.log("\n⚠️ Inakaa kwa sekunde 45! Scan sasa hivi kwa simu yako.");
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`⚠️ Unganisho limekatika. Inajaribu kuwaka upya...`);
            if (shouldReconnect) {
                setTimeout(() => startBot(), 15000); 
            }
        } else if (connection === "open") {
            console.log("\n✅ HONGERA! Bot yako sasa ipo LIVE na imeunganishwa! 🎉\n");
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

process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

startBot();

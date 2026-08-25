const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal"); // Inaleta uwezo wa kuchora QR
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Kusikiliza tukio la QR Code na kuichora upya
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("\n==================================================");
            console.log("📸 SCAN QR CODE KUBWA HAPA CHINI 📸");
            console.log("==================================================\n");
            
            // Hapa inaichora ile QR Code kubwa na kamili kabisa kama ya PC yako!
            qrcode.generate(qr, { small: false }); 
            
            console.log("\n⚠️ Inakaa kwa sekunde 45! Scan sasa hivi kwa simu yako.");
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("⚠️ Unganisho limefungwa. Inajiwasha upya...");
            if (shouldReconnect) {
                setTimeout(() => startBot(), 10000); // Inasubiri sekunde 10 kabla ya kuwaka upya
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
            const text = messageType === "conversation" ? msg.message.conversation : 
                         messageType === "extendedTextMessage" ? msg.message.extendedTextMessage.text : "";

            const from = msg.key.remoteJid;

            if (text.toLowerCase() === "mambo") {
                await sock.sendMessage(from, { text: "Safi! Nilikuwa nakusubiri." }, { quoted: msg });
            }
        } catch (e) {
            console.log("Makosa kwenye kupokea ujumbe: ", e);
        }
    });
}

// Kuzuia isife njiani
process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

startBot();

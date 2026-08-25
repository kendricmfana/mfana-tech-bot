const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    // Inasimamia faili za session ili usiscan kila mara
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: true, // HII NDIO INAYOCHORA QR CODE KUBWA KAMA YA TERMINAL YA PC YAKO!
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Kufuatilia hali ya unganisho
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("⚠️ Unganisho limefungwa. Inajiwasha upya sasa hivi...");
            if (shouldReconnect) {
                startBot(); // Inawasha upya kuzuia isife
            }
        } else if (connection === "open") {
            console.log("\n✅ HONGERA! Bot yako sasa ipo LIVE na imeunganishwa kikamilifu! 🎉\n");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Sehemu ya kupokea na kujibu ujumbe
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
startBot();

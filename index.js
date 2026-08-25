const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    // Amri hii inalazimisha bot isome folda la auth_session ulilolipandisha GitHub
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        // Inaiambia WhatsApp kuwa hii ni Windows PC ya kawaida kabisa ili isikublock
        browser: ["Windows", "Chrome", "122.0.0.0"] 
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("⚠️ Unganisho limefungwa Railway. Inajiwasha upya baada ya sekunde 5...");
            if (shouldReconnect) setTimeout(() => startBot(), 5000);
        } else if (connection === "open") {
            console.log("\n✅ HONGERA KAKA! Bot yako ya namba +255617383650 sasa ipo LIVE Railway! 🎉\n");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0]; // Inasoma ujumbe mpya ulioingia
            if (!msg.message || msg.key.fromMe) return;

            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;

            // Kujaribu kama bot inafanya kazi
            if (text.toLowerCase() === "mambo") {
                await sock.sendMessage(from, { text: "Safi! Nilikuwa nakusubiri." }, { quoted: msg });
            }
        } catch (e) {
            console.log("Hitilafu kwenye kupokea ujumbe: ", e);
        }
    });
}
startBot();

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

// Hii inasaidia kusoma namba ya simu kama hautaiweka kwenye Railway variables
const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, resolve));
};

async function startBot() {
    // Railway inahifadhi mafaili kwenye /data kama ukiweka Volume. 
    // Kama huna volume, itatumia folda ya sasa lakini kumbuka kuweka Volume Railway isipoteze login.
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        // Muhimu: Alama hizi lazima zifanane na Chrome ya kawaida ili WhatsApp isizuie
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false // Tumezima QR ili tutumie Pairing Code ya namba
    });

    // MFUMO WA PAIRING CODE KWA NIMBA YA SIMU
    if (!sock.authState.creds.registered) {
        // Unaweza kuweka namba yako hapa chini au kwenye Railway (Environment Variables) kama PHONE_NUMBER
        // Mfano wa namba lazima ianze na kodi ya nchi: 2557XXXXXXXX
        let phoneNumber = process.env.PHONE_NUMBER; 
        
        if (!phoneNumber) {
            console.log("\n⚠️ PHONE_NUMBER haijapatikana kwenye Railway Variables.");
            phoneNumber = await question("Weka namba ya simu ya bot (Mfano: 255712345678): ");
        }

        phoneNumber = phoneNumber.replace(/[^0-9]/g, ""); // Inasafisha herufi zilizozidi

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("\n==================================================");
                console.log(`🔑 KODI YAKO YA WHATSAPP NI: ${code}`);
                console.log("==================================================");
                console.log("Fungua WhatsApp > Linked Devices > Link with phone number badala yake, kisha weka kodi hiyo hapo juu!\n");
            } catch (error) {
                console.log("Imeshindwa kutengeneza kodi ya pairing: ", error);
            }
        }, 3000); // Inasubiri sekunde 3 mfumo uwake vizuri kabla ya kuomba kodi
    }

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("⚠️ Unganisho limefungwa. Inajiwasha upya baada ya sekunde 5...");
            if (shouldReconnect) {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === "open") {
            console.log("\n✅ HONGERA! Bot yako sasa ipo LIVE na imeunganishwa kwenye simu! 🎉\n");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0]; // Baileys huwa inaleta array, chukua ujumbe wa kwanza
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message)[0];
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

process.on("unhandledRejection", (err) => console.log("Unhandled Rejection: ", err));
process.on("uncaughtException", (err) => console.log("Uncaught Exception: ", err));

startBot();

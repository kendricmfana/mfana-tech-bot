const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

// WEKA NAMBA YAKO YA SIMU HAPA (Anza na 255)
const PHONE_NUMBER = "255712345678"; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        // Mpangilio mpya unaokubalika na matoleo yote ya WhatsApp bila kukwama
        browser: ["Mac OS", "Chrome", "10.0.0"] 
    });

    if (!sock.authState.creds.registered) {
        await delay(5000); // Inapa seva muda wa sekunde 5 kutulia kwanza
        try {
            let code = await sock.requestPairingCode(PHONE_NUMBER);
            let formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            
            console.log("\n==================================================");
            console.log(`🔥 CODE YAKO MPYA: ${formattedCode} 🔥`);
            console.log("==================================================\n");
            console.log("⚠️ Ingiza namba hii kwenye simu yako sasa hivi kabla seva haijajizima!");
        } catch (error) {
            console.error("❌ Hitilafu ya kodi: ", error);
        }
    }

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(" Unganisho limekatika. Inajaribu kuwaka upya...");
            if (shouldReconnect) {
                // Inasubiri sekunde 5 kabla ya kujiwasha upya kuzuia seva isichoke (Crash Loop)
                setTimeout(() => startBot(), 5000); 
            }
        } else if (connection === "open") {
            console.log("\n✅ Bot imeunganishwa kikamilifu! 🎉\n");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Sehemu ya kuzuia kodi isife (Keep Alive Timer)
    setInterval(() => {
        if (!sock.authState.creds.registered) {
            console.log("... Mfumo bado unasubiri uingize namba kwenye WhatsApp ...");
        }
    }, 20000); // Kila baada ya sekunde 20 inakumbusha seva kuwa bado inafanya kazi
}

startBot();

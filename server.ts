import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- WhatsApp API Endpoints ---

  // 1. Send Message API
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, message, type = "text" } = req.body;
    
    console.log(`[WhatsApp API] Sending ${type} to ${to}: ${message}`);

    // REAL INTEGRATION PLACEHOLDER:
    // If using Meta Cloud API:
    // const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: message } })
    // });

    // For now, we simulate success if the key is missing, or log error if configured
    if (!process.env.WHATSAPP_API_TOKEN) {
      return res.json({ 
        success: true, 
        status: "simulated", 
        note: "API Token missing. Running in simulation mode." 
      });
    }

    try {
      // Logic for real API call would go here
      res.json({ success: true, messageId: "wa_msg_" + Date.now() });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send WhatsApp message" });
    }
  });

  // 2. Webhook for Incoming Messages (The Bot)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    const body = req.body;

    // Logic to parse incoming message (Meta/Twilio format)
    // Example: const incomingMsg = body.entry[0].changes[0].value.messages[0].text.body;
    // Example: const sender = body.entry[0].changes[0].value.messages[0].from;

    console.log("[WhatsApp Bot] Received message:", JSON.stringify(body, null, 2));

    // Simple Bot Logic:
    // if (incomingMsg.toUpperCase().startsWith("RESULT")) {
    //    const rollNo = incomingMsg.split(" ")[1];
    //    await sendWhatsApp(sender, `Result for ${rollNo}: Passed with Grade A!`);
    // }

    res.sendStatus(200);
  });

  // 3. Webhook Verification (Meta requires this)
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("[WhatsApp Webhook] Verified!");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });

  // --- Vite Integration ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

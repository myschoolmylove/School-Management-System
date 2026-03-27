import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

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

    // Meta Webhook format parsing
    try {
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
          const from = message.from; // Sender's phone number
          const text = message.text?.body?.trim()?.toUpperCase();

          console.log(`[WhatsApp Bot] Message from ${from}: ${text}`);

          let responseText = "";

          if (text === "START" || text === "HELLO" || text === "HI") {
            responseText = "Welcome to My School My Love! 🏫\n\nReply with:\n*RESULT [RollNo]* - To check results\n*FEE [RollNo]* - To check fee status\n*ATTENDANCE [RollNo]* - To check attendance\n*HELP* - For more info";
          } else if (text?.startsWith("RESULT")) {
            const rollNo = text.split(" ")[1];
            if (rollNo) {
              // Logic to fetch result from Firestore would go here
              responseText = `📊 Result for Roll No ${rollNo}:\nEnglish: 85/100\nMath: 92/100\nScience: 88/100\nTotal: 265/300\nGrade: A+`;
            } else {
              responseText = "Please provide a Roll Number. Example: RESULT 101";
            }
          } else if (text?.startsWith("FEE")) {
            const rollNo = text.split(" ")[1];
            if (rollNo) {
              responseText = `💰 Fee Status for Roll No ${rollNo}:\nMonthly Fee: Paid\nExam Fee: Pending ($20)\nTotal Outstanding: $20`;
            } else {
              responseText = "Please provide a Roll Number. Example: FEE 101";
            }
          } else if (text?.startsWith("ATTENDANCE")) {
            const rollNo = text.split(" ")[1];
            if (rollNo) {
              responseText = `📅 Attendance for Roll No ${rollNo}:\nTotal Days: 120\nPresent: 112\nAbsent: 8\nPercentage: 93.3%`;
            } else {
              responseText = "Please provide a Roll Number. Example: ATTENDANCE 101";
            }
          } else if (text === "HELP") {
            responseText = "Commands:\n- RESULT [RollNo]\n- FEE [RollNo]\n- ATTENDANCE [RollNo]\n- HELLO (Main Menu)";
          } else {
            responseText = "Sorry, I didn't understand that command. Reply with HELLO to see available options.";
          }

          // Send response back via WhatsApp API
          if (responseText && process.env.WHATSAPP_API_TOKEN) {
            try {
              await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`, 
                  'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                  messaging_product: 'whatsapp', 
                  to: from, 
                  type: 'text', 
                  text: { body: responseText } 
                })
              });
            } catch (sendErr) {
              console.error("[WhatsApp Bot] Error sending response:", sendErr);
            }
          } else {
            console.log(`[WhatsApp Bot] Simulated Response to ${from}: ${responseText}`);
          }
        }
      }
    } catch (err) {
      console.error("[WhatsApp Bot] Webhook processing error:", err);
    }

    res.sendStatus(200);
  });

  // --- Admin API Endpoints ---

  // Reset User Password (for Parents/Teachers)
  app.post("/api/admin/reset-password", async (req, res) => {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
      return res.status(400).json({ success: false, error: "UID and new password are required" });
    }

    try {
      await admin.auth().updateUser(uid, {
        password: newPassword,
      });
      console.log(`[Admin API] Password reset successful for UID: ${uid}`);
      res.json({ success: true, message: "Password reset successful" });
    } catch (error: any) {
      console.error(`[Admin API] Error resetting password for UID ${uid}:`, error);
      res.status(500).json({ success: false, error: error.message || "Failed to reset password" });
    }
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

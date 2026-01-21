import admin from "firebase-admin";
import type { VercelRequest, VercelResponse } from "@vercel/node";

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, title, body, data } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {
        type: "pet-alert",
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({ error: "Failed to send notification" });
  }
}
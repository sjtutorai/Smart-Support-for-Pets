import admin from "firebase-admin";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  // In production, use process.env.FIREBASE_SERVICE_ACCOUNT
  // For local dev without env vars, this might fail or need mock credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    });
  } else {
    // Fallback or warning
    console.warn("FIREBASE_SERVICE_ACCOUNT missing in env");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, uid } = req.body;

  if (!token || !uid) {
    return res.status(400).json({ error: "Missing token or uid" });
  }

  try {
    const db = admin.firestore();
    
    // Store the token in the user's document
    // Using arrayUnion ensures unique tokens in the list
    await db.collection("users").doc(uid).set({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Registered device token for user ${uid}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error registering device:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
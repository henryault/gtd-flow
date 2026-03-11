import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

// Initialize Firebase Admin (once)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const STORAGE_KEY = 'gtd-items';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const uid = process.env.FIREBASE_USER_UID;
  if (!uid) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const docRef = db.doc(`users/${uid}/data/${STORAGE_KEY}`);
    const snapshot = await docRef.get();
    const items = snapshot.exists ? snapshot.data().value || [] : [];

    const newItem = {
      id: randomUUID(),
      text: text.trim(),
      status: 'inbox',
      type: null,
      notes: null,
      estimatedMinutes: null,
      createdAt: new Date().toISOString(),
      clarifiedAt: null,
      completedAt: null,
    };

    await docRef.set({ value: [newItem, ...items] });

    return res.status(200).json({ success: true, item: newItem });
  } catch (err) {
    console.error('Error adding item:', err);
    return res.status(500).json({ error: 'Failed to add item' });
  }
}

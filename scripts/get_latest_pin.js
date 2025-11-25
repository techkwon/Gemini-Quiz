const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');

// Hardcode config for script usage (copied from .env.local or known config)
// Since I can't easily read .env.local in a node script without dotenv, I'll try to read the file first or just assume standard config if I knew it.
// Actually, I'll read .env.local first to get the config.

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const config = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        config[key.trim()] = value.trim();
    }
});

const firebaseConfig = {
    apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getPin() {
    try {
        const q = query(
            collection(db, 'game_sessions'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const snapshot = await getDocs(q);
        const session = snapshot.docs.find(doc => doc.data().status === 'WAITING');

        if (session) {
            console.log('PIN:' + session.data().pinCode);
        } else {
            console.log('No active session found');
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

getPin();

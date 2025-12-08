const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to your Service Account Key JSON file
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: serviceAccountKey.json not found.');
    console.error('Please place your Firebase Service Account JSON file in this directory and name it "serviceAccountKey.json".');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uid = process.env.ADMIN_UID;
const customClaims = {
    role: 'admin'
};

async function setAdminClaim() {
    try {
        // Set custom user claims
        await admin.auth().setCustomUserClaims(uid, customClaims);
        console.log(`Custom claims set for user ${uid}.`);

        // Verify the claims were set
        const userRecord = await admin.auth().getUser(uid);
        console.log('User claims:', userRecord.customClaims);

        if (userRecord.customClaims && userRecord.customClaims['role'] === 'admin') {
            console.log('SUCCESS: User now has "role: admin" claim.');
        } else {
            console.error('FAILURE: User does not have the expected claims.');
        }

    } catch (error) {
        console.error('Error setting custom claims:', error);
    } finally {
        process.exit();
    }
}

setAdminClaim();

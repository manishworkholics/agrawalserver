const axios = require('axios');
const { google } = require('googleapis');
const admin = require("firebase-admin");

// Firebase service account setup
const serviceAccount = require("../service-account.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const projectId = serviceAccount.project_id;
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];

// Function to get access token
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const jwtClient = new google.auth.JWT(
            serviceAccount.client_email,
            null,
            serviceAccount.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize((err, tokens) => {
            if (err) {
                return reject(err);
            }
            resolve(tokens.access_token);
        });
    });
}

// Function to send notification to a single device
const sendNotificationSingle = async (fcm_token, title, channelId, imageUrl) => {
    try {
        if (!fcm_token || !title) {
            throw new Error('Device token, title, and description are required.');
        }

        const accessToken = await getAccessToken();
        const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        const data = {
            message: {
                notification: {
                    title,
                    
                    image: imageUrl,
                },
                data: {
                    channelKey: channelId,
                },
                token: fcm_token,
            },
        };

        const response = await axios.post(url, data, { headers });
        console.log('Notification sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending notification:', error.response ? error.response.data : error.message);
    }
};


module.exports = { sendNotificationSingle };

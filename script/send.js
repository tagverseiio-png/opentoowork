// 1. Set up the API endpoint and configuration
const API_URL = 'https://opentoowork-email-api.vercel.app/api/send-email';
const API_KEY = process.env.EMAIL_API_KEY || 'test-api-key-123'; // Replace with the actual API key in production

// 2. Set up the Email Data
const emailData = {
    to: 'ceo@strucureo.com',
    subject: 'Account Verification',
    text: 'Please verify your account to proceed.',
    html: '<p>Please <b>verify your account</b> to proceed.</p>'
};

// 3. Send the Email
async function sendEmail() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        console.log('Email sent successfully!');
        console.log('Response:', data);
    } catch (error) {
        console.error('Error occurred while sending:', error.message);
    }
}

sendEmail();
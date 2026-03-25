// 1. Set up the API endpoint and configuration
const API_URL = 'https://opentoowork-email-api.vercel.app/api/send-email';
const API_KEY = import.meta.env.VITE_EMAIL_API_KEY || 'test-api-key-123'; // Make sure to set VITE_EMAIL_API_KEY in your .env file

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email using the OpenToWork Email API.
 * The 'from' address is automatically handled by the API (verify@opentoowork.tech).
 */
export async function sendEmail({ to, subject, html, text }: EmailParams) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text: text || ''
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email request failed');
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error occurred while sending email:', error.message);
    return { success: false, error: error.message };
  }
}

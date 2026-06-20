const sendSMS = async (to, body) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log("⚠️ Twilio credentials missing. Simulated SMS to", to, ":", body);
    return;
  }

  try {
    // Lazy-load so this util is safe to import even when twilio isn't installed
    // (e.g. dev without SMS). It's only needed once credentials are configured.
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`📱 SMS successfully dispatched to ${to}`);
  } catch (error) {
    console.error(`❌ Twilio SMS Failed for ${to}:`, error.message);
  }
};

module.exports = sendSMS;

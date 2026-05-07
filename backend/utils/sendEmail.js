const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendPostAlertEmail = async (bccEmails, postDetails) => {
  if (!bccEmails || bccEmails.length === 0) return;

  const radarLink = `${process.env.FRONTEND_URL}/radar`;

  const isEmergency = postDetails.isEmergency || postDetails.priority === 'high';
  
  const theme = {
    title: isEmergency ? "EMERGENCY ALERT IN YOUR SECTOR" : "NGO RELIEF UPDATE NEARBY",
    subject: isEmergency ? `🚨 URGENT: ${postDetails.bloodGroup || 'Assistance'} Needed` : `📢 Local Update: Verified NGO Relief Camp`,
    color: isEmergency ? "#ff4a1c" : "#1e7a6f",
    border: isEmergency ? "#ff4a1c" : "#1e7a6f",
    messageLabel: isEmergency ? "Emergency Details" : "Relief Details",
  };

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    bcc: bccEmails, 
    subject: theme.subject,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border-radius: 24px; color: #29524a; border: 1px solid rgba(132, 107, 138, 0.3); box-shadow: 0 20px 40px rgba(41, 82, 74, 0.08);">
        <h2 style="color: ${theme.color}; margin-top: 0; font-weight: 900; font-style: italic; letter-spacing: -0.05em;">${theme.title}</h2>
        <p style="color: #846b8a; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">A nearby Sahayam member has updated the grid.</p>
        <div style="background-color: #ffffff; padding: 24px; border-left: 4px solid ${theme.border}; border-radius: 16px; margin: 30px 0; box-shadow: 0 4px 6px rgba(132, 107, 138, 0.1);">
          <p style="margin: 0 0 10px 0; color: #846b8a; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 900;">${theme.messageLabel}</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #29524a;">"${postDetails.message}"</p>
          ${postDetails.bloodGroup ? `<p style="margin: 15px 0 0 0; color: ${theme.color}; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Required: ${postDetails.bloodGroup}</p>` : ''}
          ${postDetails.requesterName ? `<p style="margin: 15px 0 0 0; color: #29524a; font-weight: 500; font-size: 14px;"><strong>Contact:</strong> ${postDetails.requesterName} ${postDetails.requesterPhone ? `(${postDetails.requesterPhone})` : ''}</p>` : ''}
        </div>
        <p style="color: #29524a; margin-bottom: 30px; font-weight: 500;">Access the radar to view the exact location and establish contact.</p>
        <a href="${radarLink}" style="display: inline-block; padding: 16px 32px; background-color: ${theme.border}; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 25px rgba(41, 82, 74, 0.2); margin-right: 10px; margin-bottom: 10px;">Open Radar</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email Blast Failed:", error.message);
  }
};

const sendCertificateEmail = async (email, name, totalDonations) => {
  const mailOptions = {
    from: `"Sahayam Team" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "🏆 Official Certificate of Heroism - Sahayam",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 4px solid #29524a; border-radius: 20px; text-align: center; background-color: #fcf9f2;">
        <h1 style="color: #ff4a1c; text-transform: uppercase; letter-spacing: 2px;">Sahayam</h1>
        <h3 style="color: #29524a; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 30px;">Certificate of Heroism</h3>
        <p style="color: #846b8a; font-size: 16px;">This certificate is proudly presented to</p>
        <h2 style="color: #9f1164; font-size: 32px; margin: 10px 0;">${name}</h2>
        <p style="color: #846b8a; font-size: 16px;">in recognition of completing <b>${totalDonations}</b> life-saving missions.</p>
        <div style="margin: 40px 0; padding: 20px; background-color: white; border-radius: 10px; border: 1px solid #e2d8e5;">
          <p style="color: #29524a; font-size: 14px; font-style: italic;">"A community is only as strong as its willingness to protect one another."</p>
        </div>
        <p style="color: #846b8a; font-size: 12px; margin-top: 30px; text-transform: uppercase;">Post this on LinkedIn to inspire others!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Certificate Email sending failed:", error);
  }
};

const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"Sahayam Team" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Welcome to Sahayam - The Lifesaver Grid 🩸",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #fdfbf7; border-radius: 20px; border: 1px solid #e2d8e5;">
        <h1 style="color: #ff4a1c; margin-bottom: 5px;">Welcome to Sahayam, ${name}!</h1>
        <p style="color: #846b8a; font-size: 16px;">You are now part of a critical peer-to-peer lifesaver network.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #1e7a6f;">
          <p style="color: #29524a; font-size: 15px; margin: 0;"><strong>Your Mission:</strong> Keep an eye on your radar. If someone nearby needs emergency assistance or blood, you'll be pinged. Every second counts.</p>
        </div>

        <p style="color: #29524a; font-size: 14px;">Log in to set your location radius and invite your friends. Together, we save lives.</p>
        <a href="${process.env.FRONTEND_URL}" style="display: inline-block; margin-top: 15px; padding: 12px 25px; background-color: #ff4a1c; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Dashboard</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Welcome Email Failed:", error.message);
  }
};

const sendVerificationEmail = async (email, name, token) => {
  const mailOptions = {
    from: `"Sahayam Team" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Verify your email for Sahayam 🛡️",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #fdfbf7; border-radius: 20px; border: 1px solid #e2d8e5;">
        <h1 style="color: #ff4a1c; margin-bottom: 5px;">Security Verification, ${name}</h1>
        <p style="color: #846b8a; font-size: 16px;">To keep the Sahayam emergency network safe from spam, please verify your email.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #1e7a6f; text-align: center;">
          <h2 style="color: #29524a; font-size: 24px; letter-spacing: 4px; margin: 0;">${token}</h2>
        </div>

        <p style="color: #29524a; font-size: 14px;">Enter this code in the app to complete your registration.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Verification Email Failed:", error.message);
  }
};

module.exports = { sendPostAlertEmail, sendCertificateEmail, sendWelcomeEmail, sendVerificationEmail };
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
    title: isEmergency ? "Someone nearby needs your help" : "Community Update Nearby",
    subject: isEmergency ? `Support requested: ${postDetails.bloodGroup || 'Assistance'} needed near you` : `Community Update: Local Relief Camp`,
    color: isEmergency ? "#9f1164" : "#29524a",
    border: isEmergency ? "#9f1164" : "#29524a",
    messageLabel: isEmergency ? "Request Details" : "Relief Details",
  };

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    bcc: bccEmails, 
    subject: theme.subject,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border-radius: 24px; color: #29524a; border: 1px solid rgba(132, 107, 138, 0.3); box-shadow: 0 20px 40px rgba(41, 82, 74, 0.08);">
        <h2 style="color: ${theme.color}; margin-top: 0; font-weight: 800;">${theme.title}</h2>
        <p style="color: #846b8a; font-size: 15px; font-weight: 500;">A neighbor in your community has reached out for support.</p>
        <div style="background-color: #ffffff; padding: 24px; border-left: 4px solid ${theme.border}; border-radius: 16px; margin: 30px 0; box-shadow: 0 4px 6px rgba(132, 107, 138, 0.1);">
          <p style="margin: 0 0 10px 0; color: #846b8a; font-size: 12px; font-weight: 700; text-transform: uppercase;">${theme.messageLabel}</p>
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #29524a; line-height: 1.5;">"${postDetails.message}"</p>
          ${postDetails.bloodGroup ? `<p style="margin: 15px 0 0 0; color: ${theme.color}; font-weight: 700; font-size: 15px;">Support Needed: ${postDetails.bloodGroup}</p>` : ''}
          ${postDetails.requesterName ? `<p style="margin: 15px 0 0 0; color: #29524a; font-weight: 500; font-size: 15px;"><strong>Contact:</strong> ${postDetails.requesterName} ${postDetails.requesterPhone ? `(${postDetails.requesterPhone})` : ''}</p>` : ''}
          ${postDetails.lat && postDetails.lng ? `<p style="margin: 10px 0 0 0; color: #29524a; font-weight: 500; font-size: 15px;"><strong>Location:</strong> <a href="https://maps.google.com/?q=${postDetails.lat},${postDetails.lng}" style="color: ${theme.color}; text-decoration: underline;">View on Map</a></p>` : ''}
        </div>
        <p style="color: #29524a; margin-bottom: 30px; font-weight: 500;">If you are in a position to help, please connect through the platform.</p>
        <a href="${radarLink}" style="display: inline-block; padding: 14px 28px; background-color: ${theme.border}; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; box-shadow: 0 10px 25px rgba(41, 82, 74, 0.2);">Offer Support</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email Blast Failed:", error.message);
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email, 
    subject: "Reset your Sahayam password",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border-radius: 24px; color: #29524a; border: 1px solid rgba(132, 107, 138, 0.3);">
        <h2 style="color: #29524a; margin-top: 0; font-weight: 900;">Reset your password</h2>
        <p style="color: #846b8a; font-size: 14px; font-weight: bold;">We received a request to access your account.</p>
        
        <p style="margin: 30px 0; font-size: 16px; font-weight: 500;">Click the button below to securely set a new password for your Sahayam account. For your safety, this link will expire in 15 minutes.</p>
        
        <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #9f1164; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700;">Reset Password</a>
        
        <hr style="border: 0; border-top: 1px solid rgba(132, 107, 138, 0.2); margin: 40px 0 20px 0;" />
        <p style="font-size: 12px; color: #846b8a; margin: 0; font-weight: 500;">If you did not request this change, you may safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Password Reset Email Failed:", error.message);
  }
};

const sendCertificateEmail = async (email, name, totalDonations) => {
  const mailOptions = {
    from: `"Sahayam Team" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Community Impact Recognition",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 2px solid #e8dab2; border-radius: 24px; text-align: center; background-color: #fdfbf7; box-shadow: 0 20px 40px rgba(41, 82, 74, 0.08);">
        <h1 style="color: #9f1164; font-weight: 900; margin-bottom: 5px;">Sahayam</h1>
        <h3 style="color: #29524a; margin-bottom: 30px; font-weight: 600;">Community Impact Recognition</h3>
        <p style="color: #846b8a; font-size: 16px;">This note of deep appreciation is for</p>
        <h2 style="color: #9f1164; font-size: 32px; margin: 10px 0;">${name}</h2>
        <p style="color: #846b8a; font-size: 16px; margin-bottom: 30px;">for extending a helping hand and completing <b>${totalDonations}</b> moments of support.</p>
        <div style="margin: 40px 0; padding: 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(132, 107, 138, 0.1);">
          <p style="color: #29524a; font-size: 16px; font-style: italic; font-weight: 500;">"Communities become stronger when people feel seen, supported, and connected."</p>
        </div>
        <p style="color: #846b8a; font-size: 12px; margin-top: 30px;">Thank you for making a difference.</p>
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
    subject: "Welcome to the Sahayam Community",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #fdfbf7; border-radius: 24px; border: 1px solid rgba(132, 107, 138, 0.2);">
        <h1 style="color: #9f1164; margin-bottom: 10px; font-weight: 800;">Welcome to Sahayam, ${name}.</h1>
        <p style="color: #846b8a; font-size: 16px; font-weight: 500;">We're so glad you've joined our community.</p>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 16px; margin: 30px 0; border-left: 4px solid #29524a; box-shadow: 0 4px 6px rgba(132, 107, 138, 0.1);">
          <p style="color: #29524a; font-size: 15px; margin: 0; line-height: 1.6;"><strong>Getting Started:</strong> Sahayam is a place to ask for help when things feel overwhelming, or to offer a hand when a neighbor is in need. Keep an eye on your dashboard for community requests.</p>
        </div>

        <p style="color: #29524a; font-size: 15px; margin-bottom: 25px;">You are never alone. Let's support one another.</p>
        <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 14px 28px; background-color: #29524a; color: white; text-decoration: none; border-radius: 12px; font-weight: 700;">Visit Dashboard</a>
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
    subject: "Verify your email address",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #fdfbf7; border-radius: 24px; border: 1px solid rgba(132, 107, 138, 0.2);">
        <h1 style="color: #9f1164; margin-bottom: 10px; font-weight: 800;">Verify your email</h1>
        <p style="color: #846b8a; font-size: 16px; font-weight: 500;">Hello ${name}, please verify your email address to ensure we can securely connect you with your community.</p>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 16px; margin: 30px 0; border-left: 4px solid #29524a; text-align: center; box-shadow: 0 4px 6px rgba(132, 107, 138, 0.1);">
          <h2 style="color: #29524a; font-size: 32px; letter-spacing: 6px; margin: 0;">${token}</h2>
        </div>

        <p style="color: #29524a; font-size: 15px;">Enter this code in the app to complete your setup.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Verification Email Failed:", error.message);
  }
};

module.exports = { sendPostAlertEmail, sendPasswordResetEmail, sendCertificateEmail, sendWelcomeEmail, sendVerificationEmail };
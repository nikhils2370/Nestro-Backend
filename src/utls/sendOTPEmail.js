import nodemailer from "nodemailer";

const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

if (!MAIL_USER || !MAIL_PASS) {
  console.warn("MAIL_USER or MAIL_PASS is missing. OTP emails will not work.");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,

  pool: true,
  maxConnections: 2,
  maxMessages: 50,
});

// Escape user-provided text before inserting it into HTML.
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

// Verify SMTP configuration when needed.
export const verifyMailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Gmail SMTP connection verified");
    return true;
  } catch (error) {
    console.error("Gmail SMTP verification failed:", error.message);
    return false;
  }
};

// Send OTP email
export const sendOTPEmail = async ({ email, name, otp }) => {
  try {
    if (!MAIL_USER || !MAIL_PASS) {
      throw new Error("MAIL_USER or MAIL_PASS is missing");
    }

    if (!email || !otp) {
      throw new Error("Recipient email and OTP are required");
    }

    const safeName = escapeHtml(name || "User");
    const safeOtp = escapeHtml(otp);
    const year = new Date().getFullYear();

    const mailOptions = {
      from: {
        name: "Nestro Furniture",
        address: MAIL_USER,
      },

      to: email,
      subject: "Your Nestro Verification OTP",

      text: `
Hello ${name || "User"},

Thank you for creating an account with Nestro Furniture.

Your email verification OTP is: ${otp}

This OTP is valid for 5 minutes.

If you did not request this verification, please ignore this email.
      `.trim(),

      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f5f1ed;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5ddd6;">

    <div style="padding:30px;text-align:center;background:#9a6c4c;color:#ffffff;">
      <h1 style="margin:0;">Nestro Furniture</h1>
      <p style="margin:8px 0 0;">Email Verification</p>
    </div>

    <div style="padding:30px;">
      <h2 style="margin-top:0;color:#171717;">
        Hello ${safeName},
      </h2>

      <p style="color:#555;line-height:1.7;">
        Thank you for creating an account with Nestro Furniture.
        Use the OTP below to verify your email address.
      </p>

      <div style="margin:28px 0;text-align:center;">
        <div style="display:inline-block;padding:15px 24px;background:#f8f5f1;border:1px solid #d8c7b8;border-radius:8px;font-size:30px;font-weight:bold;letter-spacing:7px;color:#9a6c4c;">
          ${safeOtp}
        </div>
      </div>

      <p style="color:#777;font-size:14px;line-height:1.7;">
        This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <p style="color:#777;font-size:14px;line-height:1.7;">
        If you did not request this verification, you can safely ignore this email.
      </p>
    </div>

    <div style="padding:20px;text-align:center;background:#f8f5f1;color:#888;font-size:12px;">
      &copy; ${year} Nestro Furniture. All rights reserved.
    </div>

  </div>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("OTP email sent:", info.messageId);

    return {
      success: true,
      message: "OTP email sent successfully",
    };
  } catch (error) {
    console.error("Send OTP Email Error:", error.message);

    return {
      success: false,
      message: "Failed to send OTP email",
    };
  }
};

import nodemailer from "nodemailer";

// ==========================================
// Nodemailer Transporter
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ==========================================
// Send OTP Email
// ==========================================

export const sendOTPEmail = async ({ email, name, otp }) => {
  try {
    const mailOptions = {
      from: `"Nestro Furniture" <${process.env.MAIL_USER}>`,
      to: email,

      subject: "Your Nestro Verification OTP",

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Email Verification</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background: #f5f1ed;
              font-family: Arial, sans-serif;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e5ddd6;
              "
            >

              <!-- Header -->
              <div
                style="
                  padding: 30px;
                  text-align: center;
                  background: #9a6c4c;
                  color: white;
                "
              >
                <h1 style="margin: 0;">
                  Nestro Furniture
                </h1>

                <p style="margin: 8px 0 0;">
                  Email Verification
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 35px 30px;">

                <h2
                  style="
                    margin-top: 0;
                    color: #171717;
                  "
                >
                  Hello ${name || "User"},
                </h2>

                <p
                  style="
                    color: #555;
                    line-height: 1.6;
                  "
                >
                  Thank you for creating an account
                  with Nestro Furniture.
                </p>

                <p
                  style="
                    color: #555;
                    line-height: 1.6;
                  "
                >
                  Use the OTP below to verify
                  your email address:
                </p>

                <!-- OTP -->
                <div
                  style="
                    margin: 30px 0;
                    text-align: center;
                  "
                >
                  <div
                    style="
                      display: inline-block;
                      padding: 15px 30px;
                      background: #f8f5f1;
                      border: 1px solid #d8c7b8;
                      border-radius: 8px;
                      font-size: 32px;
                      font-weight: bold;
                      letter-spacing: 8px;
                      color: #9a6c4c;
                    "
                  >
                    ${otp}
                  </div>
                </div>

                <p
                  style="
                    color: #777;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  This OTP is valid for
                  <strong>5 minutes</strong>.
                </p>

                <p
                  style="
                    color: #777;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  If you did not request this
                  verification, you can safely
                  ignore this email.
                </p>

              </div>

              <!-- Footer -->
              <div
                style="
                  padding: 20px;
                  text-align: center;
                  background: #f8f5f1;
                  color: #888;
                  font-size: 12px;
                "
              >
                © ${new Date().getFullYear()}
                Nestro Furniture. All rights reserved.
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
    console.error("Send OTP Email Error:", error);

    return {
      success: false,
      message: "Failed to send OTP email",
    };
  }
};

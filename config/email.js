import nodemailer from 'nodemailer';

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - User's name
 */
export const sendOTP = async (email, otp, userName) => {
    const mailOptions = {
        from: `"WhiskAutomator" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP - WhiskAutomator',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background-color: #f9fafb;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                        padding: 40px 32px;
                        text-align: center;
                    }
                    .logo {
                        width: 64px;
                        height: 64px;
                        background-color: #000;
                        color: #fbbf24;
                        border-radius: 16px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        font-weight: 900;
                        margin-bottom: 16px;
                    }
                    .header h1 {
                        color: #000;
                        margin: 0;
                        font-size: 28px;
                        font-weight: 900;
                    }
                    .content {
                        padding: 40px 32px;
                    }
                    .greeting {
                        font-size: 18px;
                        color: #111827;
                        margin-bottom: 16px;
                        font-weight: 600;
                    }
                    .message {
                        font-size: 16px;
                        color: #6b7280;
                        line-height: 1.6;
                        margin-bottom: 32px;
                    }
                    .otp-container {
                        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                        border: 2px solid #fbbf24;
                        border-radius: 16px;
                        padding: 24px;
                        text-align: center;
                        margin: 32px 0;
                    }
                    .otp-label {
                        font-size: 14px;
                        color: #92400e;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 8px;
                    }
                    .otp-code {
                        font-size: 48px;
                        font-weight: 900;
                        color: #000;
                        letter-spacing: 8px;
                        font-family: 'Courier New', monospace;
                    }
                    .warning {
                        background-color: #fef2f2;
                        border-left: 4px solid #ef4444;
                        padding: 16px;
                        border-radius: 8px;
                        margin: 24px 0;
                    }
                    .warning-text {
                        font-size: 14px;
                        color: #991b1b;
                        margin: 0;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f9fafb;
                        padding: 24px 32px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer-text {
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0;
                    }
                    .link {
                        color: #f59e0b;
                        text-decoration: none;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">W</div>
                        <h1>Password Reset Request</h1>
                    </div>
                    
                    <div class="content">
                        <p class="greeting">Hi ${userName},</p>
                        
                        <p class="message">
                            We received a request to reset your password for your WhiskAutomator account. 
                            Use the OTP code below to complete your password reset:
                        </p>
                        
                        <div class="otp-container">
                            <div class="otp-label">Your OTP Code</div>
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <p class="message">
                            This OTP will expire in <strong>10 minutes</strong>. 
                            You have <strong>5 attempts</strong> to enter the correct code.
                        </p>
                        
                        <div class="warning">
                            <p class="warning-text">
                                ⚠️ If you didn't request this password reset, please ignore this email or 
                                contact our support team if you have concerns.
                            </p>
                        </div>
                        
                        <p class="message">
                            Need help? Visit our <a href="${process.env.CLIENT_URL}/about" class="link">support page</a> 
                            or reply to this email.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p class="footer-text">
                            © ${new Date().getFullYear()} WhiskAutomator. All rights reserved.<br>
                            This is an automated email, please do not reply directly to this message.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

export default transporter;

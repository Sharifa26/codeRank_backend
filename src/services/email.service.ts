import { mailTransporter } from "../config/mail";

class EmailService {
  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const subject = "Reset your CodeRank password";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password reset request</h2>
        <p>You requested a password reset for your CodeRank account.</p>
        <p>
          Click the link below to reset your password (valid for 15 minutes):
        </p>
        <p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        </p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }
}

export default new EmailService();

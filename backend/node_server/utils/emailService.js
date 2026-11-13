import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const htmlWrapper = (title, bodyHtml, footer) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
    .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #bae6fd; font-weight: 400; }
    .content { padding: 32px; }
    .content h2 { color: #f1f5f9; font-size: 16px; margin: 0 0 16px; font-weight: 600; }
    .content p { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 12px; }
    .stats-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .stats-table th { background: #334155; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 12px; text-align: left; font-weight: 600; }
    .stats-table td { background: #0f172a; color: #e2e8f0; padding: 10px 12px; border-bottom: 1px solid #334155; font-size: 14px; }
    .stats-table tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-high { background: #fecaca; color: #991b1b; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #dcfce7; color: #166534; }
    .cta { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-top: 24px; }
    .cta h3 { color: #f8fafc; font-size: 14px; margin: 0 0 12px; font-weight: 600; }
    .cta ul { margin: 0; padding: 0; list-style: none; }
    .cta li { color: #94a3b8; font-size: 13px; margin: 0 0 6px; padding-left: 20px; position: relative; }
    .cta li::before { content: "•"; color: #0891b2; position: absolute; left: 0; font-weight: 700; }
    .footer { background: #0f172a; padding: 20px 32px; color: #64748b; font-size: 11px; border-top: 1px solid #334155; text-align: center; }
    .footer a { color: #38bdf8; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p>Daduru Oya River Basin Flood Prediction System</p>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      ${footer || 'Daduru Oya Flood Prediction System &mdash; Automated alert'}
    </div>
  </div>
</body>
</html>
`;

export const sendEmailAlert = async (recipient, subject, message, isHtml = false) => {
  try {
    const htmlContent = isHtml ? message : htmlWrapper('Flood Alert', `<p>${message.replace(/\n/g, '<br>')}</p>`);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: `[Daduru Oya Flood Warning] ${subject}`,
      html: htmlContent,
      text: message,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};

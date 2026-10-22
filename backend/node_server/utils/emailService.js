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

export const sendEmailAlert = async (recipient, subject, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: `[Daduru Oya Flood Warning] ${subject}`,
      text: message,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};

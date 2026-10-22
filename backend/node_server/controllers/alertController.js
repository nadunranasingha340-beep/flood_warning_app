import { sendEmailAlert } from '../utils/emailService.js';

export const sendWarningEmail = async (req, res) => {
    const { recipient_email, subject, message } = req.body;
    try {
        await sendEmailAlert(recipient_email, subject, message);
        res.json({ message: 'Alert email dispatched successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send email alert' });
    }
};
import { sendEmailAlert } from '../utils/emailService.js';
import db from '../config/db.js';
import { addDays } from '../services/telemetryService.js';

const riskBadge = (level) => {
    const classes = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
    return `<span class="badge ${classes[level] || 'badge-low'}">${level}</span>`;
};

const stationRowHtml = (station, prediction) => {
    const forecastDate = addDays(prediction.prediction_date, 1);
    const exceeds = Number(prediction.predicted_water_level) >= Number(station.flood_threshold_m);
    return `
        <tr>
            <td>${station.station_name}</td>
            <td>${station.station_code}</td>
            <td>${forecastDate}</td>
            <td>${prediction.predicted_water_level} m</td>
            <td>${riskBadge(prediction.risk_level)}</td>
            <td>${station.flood_threshold_m} m</td>
            <td>${exceeds ? '<span style="color:#f87171;font-weight:700">YES</span>' : '<span style="color:#34d399;font-weight:700">No</span>'}</td>
        </tr>
    `;
};

export const sendWarningEmail = async (req, res) => {
    const { recipient_email, subject, message } = req.body;
    try {
        await sendEmailAlert(recipient_email, subject, message);
        res.json({ message: 'Alert email dispatched successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send email alert' });
    }
};

export const getStationEmails = async (req, res) => {
    try {
        const rows = db.prepare('SELECT id, station_code, station_name, email FROM stations ORDER BY id').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStationEmail = async (req, res) => {
    const { station_id } = req.params;
    const { email } = req.body;
    try {
        db.prepare('UPDATE stations SET email = ? WHERE id = ?').run(email, station_id);
        res.json({ message: 'Station email saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const sendDailyReports = async (req, res) => {
    try {
        const stations = db.prepare('SELECT * FROM stations ORDER BY id').all();
        const results = [];

        // Build combined report HTML with all stations
        let combinedHtml = `
            <h2>Daily Flood Report - All Stations</h2>
            <p>Report Date: ${new Date().toLocaleDateString()}</p>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Station</th>
                        <th>Code</th>
                        <th>Forecast Date</th>
                        <th>Predicted Level</th>
                        <th>Risk Level</th>
                        <th>Threshold</th>
                        <th>Exceeded</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const highRiskStations = [];

        for (const station of stations) {
            const latestPrediction = db.prepare(
                `SELECT prediction_date, predicted_water_level, risk_level, model_used
                   FROM predictions_log
                  WHERE station_id = ?
                  ORDER BY prediction_date DESC
                  LIMIT 1`
            ).get(station.id);

            if (latestPrediction) {
                combinedHtml += stationRowHtml(station, latestPrediction);
                if (latestPrediction.risk_level === 'HIGH') {
                    highRiskStations.push({ station, prediction: latestPrediction });
                }
            } else {
                combinedHtml += `
                    <tr>
                        <td>${station.station_name}</td>
                        <td>${station.station_code}</td>
                        <td colspan="5">No prediction data available.</td>
                    </tr>
                `;
            }
        }

        combinedHtml += `</tbody></table>`;

        // Send combined report to all configured emails
        let combinedSent = 0;
        let combinedFailed = 0;

        for (const station of stations) {
            const recipient = station.email || null;
            if (!recipient) {
                results.push({
                    station_id: station.id,
                    station_name: station.station_name,
                    recipient_email: 'not configured',
                    subject: 'Daily Flood Report - All Stations',
                    status: 'skipped',
                });
                continue;
            }

            const subject = 'Daily Flood Report - All Stations';
            const logEntry = {
                station_id: station.id,
                station_name: station.station_name,
                recipient_email: recipient,
                subject,
                status: 'failed',
            };

            try {
                await sendEmailAlert(recipient, subject, combinedHtml, true);
                logEntry.status = 'sent';
                combinedSent++;
            } catch (err) {
                logEntry.status = 'failed';
                combinedFailed++;
            }

            db.prepare(
                `INSERT INTO email_logs (station_id, station_name, recipient_email, subject, status)
                 VALUES (?, ?, ?, ?, ?)`
            ).run(
                logEntry.station_id,
                logEntry.station_name,
                logEntry.recipient_email,
                logEntry.subject,
                logEntry.status
            );

            results.push(logEntry);
        }

        // Send individual HIGH risk warnings to only the affected station (HTML styled)
        let warningSent = 0;
        let warningFailed = 0;

        for (const { station, prediction } of highRiskStations) {
            const recipient = station.email || null;
            if (!recipient) continue;

            const forecastDate = addDays(prediction.prediction_date, 1);
            const exceeds = Number(prediction.predicted_water_level) >= Number(station.flood_threshold_m);
            const subject = `HIGH FLOOD RISK WARNING - ${station.station_name}`;
            const message = `
                <h2 style="color:#f87171;">HIGH FLOOD RISK WARNING</h2>
                <p><strong>Station:</strong> ${station.station_name} (${station.station_code})</p>
                <p><strong>Warning Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Tomorrow's Forecast (${forecastDate}):</strong> ${prediction.predicted_water_level} m</p>
                <p><strong>Flood Risk Level:</strong> ${riskBadge(prediction.risk_level)}</p>
                <p><strong>Flood Threshold:</strong> ${station.flood_threshold_m} m</p>
                <p><strong>Threshold Exceeded:</strong> ${exceeds ? 'YES' : 'No'}</p>
                <p style="color:#f87171;font-weight:700;">Immediate action may be required.</p>
            `;

            const logEntry = {
                station_id: station.id,
                station_name: station.station_name,
                recipient_email: recipient,
                subject,
                status: 'failed',
            };

            try {
                await sendEmailAlert(recipient, subject, message, true);
                logEntry.status = 'sent';
                warningSent++;
            } catch (err) {
                logEntry.status = 'failed';
                warningFailed++;
            }

            db.prepare(
                `INSERT INTO email_logs (station_id, station_name, recipient_email, subject, status)
                 VALUES (?, ?, ?, ?, ?)`
            ).run(
                logEntry.station_id,
                logEntry.station_name,
                logEntry.recipient_email,
                logEntry.subject,
                logEntry.status
            );

            results.push(logEntry);
        }

        const totalSent = combinedSent + warningSent;
        const totalFailed = combinedFailed + warningFailed;
        const allFailed = totalSent === 0 && totalFailed > 0;

        if (allFailed) {
            return res.status(500).json({
                error: 'All email dispatches failed',
                results,
                summary: { sent: totalSent, failed: totalFailed },
            });
        }

        res.json({
            message: totalFailed > 0
                ? `Daily reports processed with some failures (${totalSent} sent, ${totalFailed} failed)`
                : 'Daily reports processed successfully',
            results,
            summary: { sent: totalSent, failed: totalFailed },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const clearEmailLogs = async (req, res) => {
    try {
        db.prepare('DELETE FROM email_logs').run();
        res.json({ message: 'All email logs cleared successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getEmailLogs = async (req, res) => {
    try {
        const rows = db.prepare(
            `SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100`
        ).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTodayEmailStatus = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const rows = db.prepare(
            `SELECT * FROM email_logs WHERE sent_at LIKE ?`
        ).all(`${today}%`);

        const sent = rows.some((r) => r.status === 'sent');
        const sentStations = rows
            .filter((r) => r.status === 'sent')
            .map((r) => r.station_name);

        res.json({ sent, sentStations, count: rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
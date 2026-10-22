import db from '../config/db.js';

export const getStations = async (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM stations ORDER BY id').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStationThreshold = async (req, res) => {
    const { threshold } = req.body;
    const { id } = req.params;
    try {
        db.prepare('UPDATE stations SET flood_threshold_m = ? WHERE id = ?').run(threshold, id);
        res.json({ message: 'Station flood threshold updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
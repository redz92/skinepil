const { kv } = require('@vercel/kv');
const { verifyAuth } = require('./_utils');

const KV_KEY = 'skinepil:blocked-slots';

module.exports = async function handler(req, res) {

    // GET — public: returns blocked slots (needed by booking page)
    if (req.method === 'GET') {
        try {
            const slots = await kv.get(KV_KEY) || [];
            return res.status(200).json(slots);
        } catch (err) {
            console.error('GET blocked-slots error:', err);
            return res.status(200).json([]);
        }
    }

    // POST — admin only: add a blocked slot
    if (req.method === 'POST') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { date, time, type, reason } = req.body;
            // type: "full-day" (whole day blocked) or "slot" (specific time)

            if (!date) {
                return res.status(400).json({ error: 'Missing date' });
            }

            const slot = {
                id: 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                date,       // "2026-04-15"
                time: time || null,  // "14:00" or null for full day
                type: type || (time ? 'slot' : 'full-day'),
                reason: reason || '',
                createdAt: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
            };

            const slots = await kv.get(KV_KEY) || [];
            slots.push(slot);
            await kv.set(KV_KEY, slots);

            return res.status(201).json({ success: true, slot });
        } catch (err) {
            console.error('POST blocked-slots error:', err);
            return res.status(500).json({ error: 'Failed to block slot' });
        }
    }

    // DELETE — admin only: remove a blocked slot
    if (req.method === 'DELETE') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ error: 'Missing id' });
            }

            let slots = await kv.get(KV_KEY) || [];
            slots = slots.filter(s => s.id !== id);
            await kv.set(KV_KEY, slots);

            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('DELETE blocked-slots error:', err);
            return res.status(500).json({ error: 'Failed to unblock slot' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

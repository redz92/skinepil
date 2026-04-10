const { kv } = require('./_kv');
const { verifyAuth } = require('./_utils');

const KV_KEY = 'skinepil:blocked-slots';

module.exports = async function handler(req, res) {

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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
            const body = req.body || {};
            const date = body.date;
            const time = body.time;
            const type = body.type;
            const reason = body.reason;

            if (!date) {
                return res.status(400).json({ error: 'Missing date', body: body });
            }

            const slot = {
                id: 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                date,
                time: time || null,
                type: type || (time ? 'slot' : 'full-day'),
                reason: reason || '',
                createdAt: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
            };

            let slots = [];
            try {
                slots = await kv.get(KV_KEY) || [];
            } catch (kvErr) {
                // KV get failed, start fresh
                slots = [];
            }

            slots.push(slot);
            await kv.set(KV_KEY, slots);

            return res.status(201).json({ success: true, slot });
        } catch (err) {
            console.error('POST blocked-slots error:', err);
            return res.status(500).json({ error: 'Failed to block slot', detail: err.message || String(err) });
        }
    }

    // DELETE — admin only: remove a blocked slot
    if (req.method === 'DELETE') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const body = req.body || {};
            const id = body.id;
            if (!id) {
                return res.status(400).json({ error: 'Missing id' });
            }

            let slots = await kv.get(KV_KEY) || [];
            slots = slots.filter(s => s.id !== id);
            await kv.set(KV_KEY, slots);

            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('DELETE blocked-slots error:', err);
            return res.status(500).json({ error: 'Failed to unblock slot', detail: err.message || String(err) });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

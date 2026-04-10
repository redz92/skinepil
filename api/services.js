const { kv } = require('./_kv');
const { verifyAuth, DEFAULT_SERVICES } = require('./_utils');

const KV_KEY = 'skinepil:services';

module.exports = async function handler(req, res) {

    // GET — public: returns current services (prices, durations)
    if (req.method === 'GET') {
        try {
            let services = await kv.get(KV_KEY);
            if (!services) {
                // Initialize with defaults
                await kv.set(KV_KEY, DEFAULT_SERVICES);
                services = DEFAULT_SERVICES;
            }
            return res.status(200).json(services);
        } catch (err) {
            console.error('GET services error:', err);
            // Fallback to defaults if KV is not available
            return res.status(200).json(DEFAULT_SERVICES);
        }
    }

    // PUT — admin only: update services
    if (req.method === 'PUT') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const services = req.body;

            if (!Array.isArray(services)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }

            await kv.set(KV_KEY, services);
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('PUT services error:', err);
            return res.status(500).json({ error: 'Failed to save services' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

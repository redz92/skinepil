const { login } = require('./_utils');

module.exports = async function handler(req, res) {

    // Temporary KV diagnostic (GET only)
    if (req.method === 'GET') {
        const url   = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (!url)   return res.status(200).json({ kv: 'MISSING URL' });
        if (!token) return res.status(200).json({ kv: 'MISSING TOKEN' });
        try {
            const r = await fetch(`${url}/pipeline`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify([['PING']])
            });
            const data = await r.json();
            return res.status(200).json({ kv: 'OK', ping: data, url: url.substring(0, 35) + '...' });
        } catch (err) {
            return res.status(200).json({ kv: 'ERROR', detail: err.message });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        const token = login(password);

        if (token) {
            return res.status(200).json({ token });
        } else {
            return res.status(401).json({ error: 'Invalid password' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
};

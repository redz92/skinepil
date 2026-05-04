const { login } = require('./_utils');

module.exports = async function handler(req, res) {

    // Temporary KV diagnostic (GET only)
    if (req.method === 'GET') {
        // Show all custom env var names (no values)
        const allKeys = Object.keys(process.env)
            .filter(k => !k.startsWith('VERCEL_') && !k.startsWith('AWS_') && !['PATH','HOME','LANG','PWD','SHLVL','TZ','NODE_PATH','NODE_ENV','LD_LIBRARY_PATH','NX_DAEMON','TURBO_CACHE','TURBO_DOWNLOAD_LOCAL_ENABLED','TURBO_PLATFORM_ENV','TURBO_REMOTE_ONLY','TURBO_RUN_SUMMARY','NOW_REGION'].includes(k))
            .sort();
        return res.status(200).json({ custom_env_keys: allKeys });
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

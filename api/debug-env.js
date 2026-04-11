module.exports = async function handler(req, res) {
    // List env var names that contain KV, REDIS, or URL (values hidden for security)
    const relevant = Object.keys(process.env)
        .filter(k => /kv|redis|url|token|rest/i.test(k))
        .map(k => k + ' = ' + (process.env[k] ? process.env[k].substring(0, 20) + '...' : '(empty)'));

    return res.status(200).json({ env_keys: relevant });
};

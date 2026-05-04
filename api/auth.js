const { login } = require('./_utils');

module.exports = async function handler(req, res) {
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

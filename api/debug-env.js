module.exports = async function handler(req, res) {
    // Show only KEY NAMES (no values) for safety
    const allKeys = Object.keys(process.env).sort();
    return res.status(200).json({ keys: allKeys });
};

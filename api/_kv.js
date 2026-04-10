/**
 * Simple KV helper using Vercel's Redis (node-redis)
 * Stores JSON values as strings in Redis
 */
const { createClient } = require('redis');

let client = null;

async function getClient() {
    if (client && client.isOpen) return client;

    const url = process.env.KV_URL;
    if (!url) {
        throw new Error('Missing KV_URL environment variable');
    }

    client = createClient({ url });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    return client;
}

const kv = {
    async get(key) {
        const c = await getClient();
        const val = await c.get(key);
        if (val === null) return null;
        try {
            return JSON.parse(val);
        } catch {
            return val;
        }
    },

    async set(key, value) {
        const c = await getClient();
        await c.set(key, JSON.stringify(value));
    }
};

module.exports = { kv };

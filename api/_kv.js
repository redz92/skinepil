/**
 * KV helper using Upstash REST API (pure fetch, no npm package needed)
 * Compatible with: Upstash Redis REST, Vercel KV REST
 */

const REST_URL   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redisCmd(...args) {
    if (!REST_URL || !REST_TOKEN) {
        throw new Error('Missing Redis credentials: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars.');
    }
    const res = await fetch(`${REST_URL}/pipeline`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${REST_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([args])
    });
    const data = await res.json();
    return data[0]?.result ?? null;
}

const kv = {
    async get(key) {
        const result = await redisCmd('GET', key);
        if (!result) return null;
        try { return JSON.parse(result); } catch { return result; }
    },
    async set(key, value) {
        await redisCmd('SET', key, JSON.stringify(value));
    }
};

module.exports = { kv };

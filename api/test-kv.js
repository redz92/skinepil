module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'text/plain');

    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url)   return res.status(200).send('ERREUR: UPSTASH_REDIS_REST_URL manquant');
    if (!token) return res.status(200).send('ERREUR: UPSTASH_REDIS_REST_TOKEN manquant');

    res.write('URL: ' + url.substring(0, 30) + '...\n');
    res.write('TOKEN: present (' + token.length + ' chars)\n');

    try {
        const r = await fetch(`${url}/ping`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const text = await r.text();
        res.write('PING response: ' + text + '\n');
        res.write('STATUS: ' + r.status + '\n');
        return res.end('\nOK - Redis fonctionne !');
    } catch (err) {
        return res.end('\nERREUR fetch: ' + err.message);
    }
};

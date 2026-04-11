module.exports = async function handler(req, res) {
    // List env var names that contain KV, REDIS, or URL (values hidden for security)
    const relevant = Object.keys(process.env)
        .filter(k => !/^(AWS_|NODE_|PATH|HOME|LANG|SHLVL|_|HOSTNAME|LAMBDA_|LD_|TZ|VERCEL_(?:URL|BRANCH|PROJECT|REGION|GIT|ENV|DEPLOYMENT|EDGE|OIDC|SKEW|WEB|AUTOMATION)|FUNCTIONBRIDGE)/.test(k))
        .sort()
        .map(k => k + ' = ' + (process.env[k] ? process.env[k].substring(0, 25) + '...' : '(empty)'));

    return res.status(200).json({ env_keys: relevant });
};

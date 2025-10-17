const apiKeys = new Set(['your-api-key1', 'your-api-key2']); // Add your API keys here

exports.validateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key');

    if (!apiKey || !apiKeys.has(apiKey)) {
        return res.status(403).json({ message: 'Forbidden - Invalid API Key' });
    }

    next();
}


const apiKeyAuth = (req, res, next) => {
    const apiKey = req.header('X-API-Key'); 
    
    if (!apiKey) {
        return res.status(401).json({ msg: "Access Denied: API Key missing" });
    }

    if (apiKey !== process.env.DATA_SERVICE_API_KEY) {
        return res.status(401).json({ msg: "Access Denied: Invalid API Key" });
    }

    next();
};

module.exports = apiKeyAuth;

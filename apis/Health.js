let health = (req, res, next) => {
    console.log(req.client.remoteAddress);
    res.json({ "errors": "0", "clientIp": req.client.remoteAddress});
};

export default health;
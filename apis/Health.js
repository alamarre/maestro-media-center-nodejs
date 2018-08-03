const health = (req, res) => {
    console.log(req.client.remoteAddress);
    res.json({ "errors": "0", "clientIp": req.client.remoteAddress,});
};

module.exports=health;
const health = (ctx) => {
    ctx.body = ({ "errors": "0", "clientIp": ctx.ip,});
};

module.exports=health;
const health = (ctx) => {
  ctx.body = ({ "errors": "0", "clientIp": ctx.ip, });
};
export default health;

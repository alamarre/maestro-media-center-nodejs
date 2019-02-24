const sharp = require("sharp");

const result = sharp("test.png")
.resize(320, 240)
.toBuffer();

console.log(result);
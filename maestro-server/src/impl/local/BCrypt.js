const bcrypt = require("bcryptjs");
const saltRounds = process.env.BCRYPT_SALT_ROUNDS || 10;

const hash = async (password) => {
    return await bcrypt.hash(password, saltRounds);
};

const match = async(password, hash) => {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
};

module.exports = {
    hash,
    match,
};
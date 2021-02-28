module.exports = (n1, n2) => {
    if (typeof n1 !== "string" || typeof n2 !== "string") {
        return false;
    }
    const reg = /([;:!?\-.])/g;
    n1 = n1.toLowerCase().replace(reg, "").replace(/ +/g, " ");
    n2 = n2.toLowerCase().replace(reg, "").replace(/ +/g, " ");
    return n1 === n2;
};
const crypto = require("crypto")

function hashPassword(password, salt = null) {
  const usedSalt = salt || crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, usedSalt, 64).toString("hex")
  return `${usedSalt}:${hash}`
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false
  }
  const [salt, originalHash] = storedHash.split(":")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(hash, "hex"))
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken
}

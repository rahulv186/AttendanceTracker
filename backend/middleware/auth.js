const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Reads JWT from Authorization header (Bearer <token>), verifies it,
 * and attaches userId to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token. Access denied." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "attendance-secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found. Token invalid." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }
    next(err);
  }
};

module.exports = authMiddleware;

const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

   let decoded;

try {
  decoded = jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
  console.error("JWT verification failed:", error.name, error.message);

  return res.status(401).json({
    message: "Invalid or expired token",
    reason: error.name,
  });
}

    // Verify the current user and role against MongoDB.
    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId || !require("mongoose").isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(userId).select("_id name email role");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;

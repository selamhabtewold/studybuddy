// middleware/auth.js
import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Expect "Bearer <token>"
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    // Fetch user from database to get role
    const User = require('../models/userModel').default; // Adjust path to your User model
    const user = await User.findById(decoded.userId).select("role");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user; // Attach user to request
    next();
  });
};

export default authenticateToken;
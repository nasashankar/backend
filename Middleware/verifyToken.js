
// import jwt from "jsonwebtoken";
// import User from "../Models/userModels.js";



// export const verifyToken = async (req, res, next) => {
//   try {
//     const authToken = req.headers.authorization?.split(" ")[1];
//     console.log("Authorization Header:", req.headers.authorization);

//     if (!authToken) {
//       return res.status(401).json({
//         success: false,
//         message: "Access Denied. No token provided.",
//       });
//     }

//     const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);

//     // 👇 Use "decoded.id" (not decoded._id)
//     req.user = await User.findById(decoded.id);

//     if (!req.user) {
//       return res.status(403).json({ message: "User not found" });
//     }

//     next();
//   } catch (error) {
//     console.error("Verify Token Error:", error);
//     res.status(403).json({ message: "Invalid token or please Login" });
//   }
// };

import jwt from "jsonwebtoken";
import User from "../Models/userModels.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Verify Token Error:", error);
    return res.status(403).json({ message: "Invalid token or please login" });
  }
};

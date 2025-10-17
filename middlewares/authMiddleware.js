// authMiddleware.js
const jwt = require('jsonwebtoken');
const ParentReg = require("../models/parentModel");
const User = require("../models/userModel");
const db = require("../config/db.config");

exports.authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Extract token if it has the 'Bearer' prefix
    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        }

        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// exports.authMiddleware = (req, res, next) => {
//   const token = req.headers["authorization"];

//   // ✅ No token → allow as guest
//   if (!token) {
//     req.userId = null;
//     req.userRole = "guest";
//     return next();
//   }

//   // Extract token if it has the 'Bearer' prefix
//   jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       console.error("JWT verify error:", err);

//       // ❌ Invalid/expired token → allow as guest
//       req.userId = null;
//       req.userRole = "guest";
//       return next();
//     }

//     // ✅ Valid token
//     req.userId = decoded.id;
//     req.userRole = decoded.role;
//     return next();
//   });
// };


exports.authMiddlewares = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        // Extract token if it has the 'Bearer' prefix
        const actualToken = token.split(' ')[1];
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

        // Check the token against the ParentReg model
        const parent = await User.findOne({ where: { parents_id: decoded.id } });

        if (!parent || parent.app_token !== actualToken) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        }

        // Attach user info to the request object
        req.userId = decoded.id;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        console.error("Error in authMiddleware:", error);
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};


// exports.authMiddlewares = async (req, res, next) => {
//   const token = req.headers["authorization"];

//   // ✅ If no token at all → allow as guest
//   if (!token) {
//     req.userId = null;
//     req.userRole = "guest";
//     return next();
//   }

//   try {
//     // Extract token if it has the 'Bearer' prefix
//     const actualToken = token.split(" ")[1];
//     const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

//     // Check the token against the ParentReg model
//     const parent = await ParentReg.findOne({
//       where: { parents_id: decoded.id },
//     });

//     // ❌ If not found or mismatch → treat as guest instead of blocking
//     if (!parent || parent.app_token !== actualToken) {
//       req.userId = null;
//       req.userRole = "guest";
//       return next();
//     }

//     // ✅ Valid token → attach user info
//     req.userId = decoded.id;
//     req.userRole = decoded.role;
//     return next();
//   } catch (error) {
//     console.error("Error in authMiddleware:", error);

//     // ❌ On error → also allow as guest instead of blocking
//     req.userId = null;
//     req.userRole = "guest";
//     return next();
//   }
// };




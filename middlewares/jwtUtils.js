const jwt = require('jsonwebtoken');

// Function to generate JWT token
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        // { expiresIn: '10h' } 
    );
};
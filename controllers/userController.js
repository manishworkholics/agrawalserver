const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const AppUserReg = require("../models/userModel");

const jwt = require("jsonwebtoken");
// Secret key for signing JWT (use a secure key and store it in env variables)
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// SignUp function
exports.signUp = async (req, res) => {
  try {
    // Add your signup logic here using Sequelize
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login function
exports.login = async (req, res) => {
  try {
    // Add your login logic here using Sequelize
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate OTP
exports.generateOtp = asyncHandler(async (req, res) => {
  const { mobile_no } = req.body;

  if (!mobile_no) {
    return res
      .status(200)
      .json({ status: false, message: "Mobile number is required" });
  }

  const otp = crypto.randomInt(1000, 10000).toString();
  const otpCreated = new Date();

  // Check if mobile number exists
  const user = await AppUserReg.findOne({ where: { mobile_no } });
  if (user) {
    // Update existing user's OTP
    user.otp = otp;
    user.otp_datetime = otpCreated;
    await user.save();
    return res
      .status(200)
      .json({ status: true, message: "OTP sent successfullyyy", otp });
  } else {
    return res.status(200).json({ status: false, message: "User Not Exist" });
  }
});

// OTP Verification
exports.otpverify = asyncHandler(async (req, res) => {
  const { mobile_no, otp } = req.body;

  if (!mobile_no || !otp) {
    return res
      .status(200)
      .json({ status: false, message: "Mobile number and OTP are required" });
  }

  const user = await AppUserReg.findOne({ where: { mobile_no } });

  if (!user) {
    return res
      .status(200)
      .json({ status: false, message: "Mobile number not found" });
  }

  const storedOtp = user.otp;
  const otpCreated = new Date(user.otp_datetime);

  // Check if OTP is valid (assuming it's valid for 10 minutes)
  const now = new Date();
  const diffInMinutes = Math.floor((now - otpCreated) / 60000);

  if (storedOtp === otp && diffInMinutes <= 10) {
    // Mark the OTP as verified
    user.is_verified = 1;
    await user.save();

    // Generate JWT token after OTP is verified
    const token = jwt.sign(
      { mobile_no: user.mobile_no, userId: user.app_user_id }, // Payload: mobile_no and app_user_id
      JWT_SECRET, 
      // { expiresIn: "1h" } 
    );

    return res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      token: token, // Return the JWT token
    });
  } else {
    return res
      .status(200)
      .json({ status: false, message: "Invalid or expired OTP" });
  }
});

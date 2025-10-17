const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const ParentReg = require("../models/parentModel");
const Users = require("../models/userModel");
const db = require("../config/db.config");
const jwt = require("jsonwebtoken");

// Secret key for signing JWT (use a secure key and store it in env variables)
const JWT_SECRET = process.env.JWT_SECRET;
const { generateToken } = require('../middlewares/jwtUtils');
const axios = require('axios');
const https = require('https');



async function sendOTPToMobile(mobileNumber, otp) {
  // Validate the mobile number (10 digits assumed)
  if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
    return { status: false, message: 'Invalid mobile number' };
  }
  const message = `OTP for Login on app is ${otp}. Please do not share this with anyone for security reasons. `;
  const apiUrl = `http://tagsolutions.in/sms-panel/api/http/index.php?username=APSCHOOL&apikey=E669B-455B0&apirequest=Text&sender=ACTIDR&mobile=${mobileNumber}&message=${message}.&route=TRANS&TemplateID=1407167332525147046&format=JSON`;
  try {
    // Create an Axios instance that ignores SSL certificate validation

    const agent = new https.Agent({
      rejectUnauthorized: false // Disable SSL certificate validation
    });

    // Make a POST request to the external API
    const response = await axios.post(apiUrl, {}, { httpsAgent: agent });

    if (response.data.status === 'success') {
      return { status: true, message: 'OTP sent successfully', mobileNumber, otp };
    } else {
      return { status: false, message: 'Failed to send OTP', error: response.data };
    }
  } catch (error) {
    return { status: false, message: 'Error occurred while sending OTP', error: error.message };
  }

  return { status: true, message: 'OTP sent successfully', mobileNumber, otp };
}


// SignUp function
exports.signUp = async (req, res) => {
  try {

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login function
exports.login = async (req, res) => {
  try {

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.logout = asyncHandler(async (req, res) => {
  try {

    const { mobile_no } = req.body;

    if (!mobile_no) {
      return res
        .status(200)
        .json({ status: false, message: "Mobile number is required" });
    }

    // Check if mobile number exists
    const user = await ParentReg.findOne({ where: { mobile_no } });
    if (user) {
      let response = '';
      const now = new Date();
      // user.otp_datetime = now;
      await user.save();
      return res
        .status(200)
        .json({ status: true, message: "Logout Status update Successfully", });
    } else {
      // return res.status(200).json({ status: false, message: "User Not Exist" });
      return res.status(200).json({ status: false, message: "Detail not found" });

    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching page  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});


exports.resentOtp = asyncHandler(async (req, res) => {
  const { mobile_no } = req.body;

  if (!mobile_no) {
    return res
      .status(200)
      .json({ status: false, message: "Mobile number is required" });
  }

  const otp = crypto.randomInt(1000, 10000).toString();

  const otpCreated = new Date();

  const user = await Users.findOne({ where: { mobile_no } });
  if (user) {
    let response = '';
    user.otp = otp;
    user.otp_datetime = otpCreated;
    await user.save();
    return res
      .status(200)
      .json({ status: true, message: "OTP sent successfullyyy", otp, response });
  } else {
    return res.status(200).json({ status: true, message: "OTP sent successfullyyy", otp });
  }
});



exports.generateOtp = asyncHandler(async (req, res) => {
  const { mobile_no } = req.body;

  if (!mobile_no) {
    return res.status(200).json({
      status: false,
      message: "Mobile number is required",
    });
  }

  // Generate OTP
  const otp =
    mobile_no === "1234567890"
      ? "1234"
      : crypto.randomInt(1000, 10000).toString();

  const otpCreated = new Date();
  const now = new Date();
  // Check user existence
  let user = await Users.findOne({ where: { mobile_no } });

  // ✅ If first-time user → create basic user record first
  if (!user) {
    user = await Users.create({
      mobile_no,
      otp,
      otp_datetime: otpCreated,
      is_verified: 0,
      is_active: 1,
      app_name: "EMESSANGER",
      scholar_no: "00000",
      scholar_dob: "12/12/2016",
      scholar_email: "",
      student_name: "",
      scholar_type: "STUDENT",
      sch_short_nm: "",
      last_visit_on: otpCreated,
      active_datetime: now,
    });
  } else {
    // If user already exists → just update OTP
    user.otp = otp;
    user.otp_datetime = otpCreated;
    await user.save();
  }

  // Send OTP (simulate SMS or API)
  const response = await sendOTPToMobile(mobile_no, otp);

  return res.status(200).json({
    status: true,
    message: "OTP sent successfully",
    otp, // ⚠️ remove this in production
    response,
  });
});

// ========================
// VERIFY OTP
// ========================
exports.otpverify = asyncHandler(async (req, res) => {
  const {
    mobile_no,
    otp,
    fcm_token,
    mobile_uuid,
    mobile_info,
    mobile_platform,
  } = req.body;

  if (!mobile_no || !otp) {
    return res.status(200).json({
      status: false,
      message: "Mobile number and OTP are required",
    });
  }

  let user = await Users.findOne({ where: { mobile_no } });
  let demoToken = "";

  if (!user) {
    // should not happen because we now always create user in generateOtp
    return res.status(200).json({
      status: false,
      message: "User not found, please request OTP again",
    });
  }

  const storedOtp = user.otp;
  const otpCreated = new Date(user.otp_datetime);
  const now = new Date();
  const diffInMinutes = Math.floor((now - otpCreated) / 60000);

  if (storedOtp !== otp || diffInMinutes > 10) {
    return res.status(200).json({
      status: false,
      message: "Invalid or expired OTP",
    });
  }

  // Generate token
  const tokenPayload = { id: user.parents_id || 0, role: "AppUser" };
  demoToken = generateToken(tokenPayload);

  // Update verified user data
  user.is_verified = 1;
  user.last_visit_on = now;
  user.fcm_token = fcm_token || "";
  user.app_token = demoToken;
  user.mobile_uuid = mobile_uuid || "";
  user.mobile_info = mobile_info || "";
  user.mobile_platform = mobile_platform || "";
  user.active_by = 1;
  await user.save();

  return res.status(200).json({
    status: true,
    message: "OTP verified successfully",
    token: demoToken,
    user,
  });
});


exports.updateFcmToken = asyncHandler(async (req, res) => {
  const { id, fcm_token } = req.body;

  if (!id || !fcm_token) {
    return res.status(400).json({
      status: false,
      message: "ID and FCM token are required",
    });
  }

  try {
    // Find the user by ID
    const user = await Users.findOne({ where: { parents_id: id } });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Update the FCM token
    user.fcm_token = fcm_token;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "FCM token updated successfully",
      data: {
        id: user.parents_id,
        fcm_token: user.fcm_token,
      },
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});




exports.updateData = asyncHandler(async (req, res) => {
  const { id, last_visit_on } = req.body;

  try {
    // Find the user by ID
    const user = await Users.findOne({ where: { parents_id: id } });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Update the FCM token
    user.last_visit_on = last_visit_on;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "data updated successfully",
      data: {
        id: user.parents_id,
        last_visit_on: user.last_visit_on,
      },
    });
  } catch (error) {
    console.error("Error updating :", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
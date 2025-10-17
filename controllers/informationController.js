
const asyncHandler = require("express-async-handler");
const informationModel = require("../models/informationModel");

exports.getinformationDetail = asyncHandler(async (req, res) => {
  try {
    // Fetch all records from the NoticeBoard table
    const information_detail = await informationModel.findAll();

    // Check if any data exists
    if (information_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: information_detail,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No_Data_Found",
        data: null,
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching information  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

const asyncHandler = require("express-async-handler");
const disclaimerModel = require("../models/disclaimerModel");


exports.getdisclaimerDetail = asyncHandler(async (req, res) => {
  try {
    // Fetch all records from the NoticeBoard table
    const disclaimer_detail = await disclaimerModel.findAll();

    // Check if any data exists
    if (disclaimer_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: disclaimer_detail,
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
    console.error("Error fetching disclaimer  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});
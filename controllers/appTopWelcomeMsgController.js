const asyncHandler = require("express-async-handler");
const appTopWelcomeMsgModel = require("../models/welcomeMsgModel");


exports.getappTopWelcomeMsgDetail = asyncHandler(async (req, res) => {
  try {
    // Fetch all records from the NoticeBoard table
    const appTopWelcomeMsg_detail = await appTopWelcomeMsgModel.findAll();

    // Check if any data exists
    if (appTopWelcomeMsg_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: appTopWelcomeMsg_detail,
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
    console.error("Error fetching appTopWelcomeMsg  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

exports.createAppTopWelcomeMsg = asyncHandler(async (req, res) => {
  try {
    const { detail } = req.body;

    const newWelcomeMsg = await appTopWelcomeMsgModel.create({
      detail,
    });

    res.status(201).json({
      status: true,
      message: "New welcome message created successfully",
      data: newWelcomeMsg,
    });
  } catch (error) {
    console.error("Error creating welcome message:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

exports.getSingleAppTopWelcomeMsg = asyncHandler(async (req, res) => {
  try {
    const { welcome_id } = req.params;

    const welcomeMsg = await appTopWelcomeMsgModel.findByPk(welcome_id);

    if (welcomeMsg) {
      res.status(200).json({
        status: true,
        message: "Data found",
        data: welcomeMsg,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No data found for the provided ID",
      });
    }
  } catch (error) {
    console.error("Error fetching welcome message:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

exports.updateAppTopWelcomeMsg = asyncHandler(async (req, res) => {
  try {
    const { welcome_id } = req.params;
    const { detail } = req.body;

    const welcomeMsg = await appTopWelcomeMsgModel.findByPk(welcome_id);

    if (welcomeMsg) {
      welcomeMsg.detail = detail;
      await welcomeMsg.save();

      res.status(200).json({
        status: true,
        message: "Welcome message updated successfully",
        data: welcomeMsg,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No data found for the provided ID",
      });
    }
  } catch (error) {
    console.error("Error updating welcome message:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

exports.deleteAppTopWelcomeMsg = asyncHandler(async (req, res) => {
  try {
    const { welcome_id } = req.params;

    // Find the record by welcome_id
    const appTopWelcomeMsg = await appTopWelcomeMsgModel.findOne({
      where: { welcome_id },
    });

    if (!appTopWelcomeMsg) {
      return res.status(404).json({
        status: false,
        message: "Record not found",
      });
    }

    // Delete the record
    await appTopWelcomeMsg.destroy();

    res.status(200).json({
      status: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appTopWelcomeMsg:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

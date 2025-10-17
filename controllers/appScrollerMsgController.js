
const asyncHandler = require("express-async-handler");
const appScrollerMsgModel = require("../models/appScrollerMsgModel");

exports.getappScrollerMsgDetail = asyncHandler(async (req, res) => {
  try {
    // Fetch all records from the NoticeBoard table
    const appScrollerMsg_detail = await appScrollerMsgModel.findAll();

    // Check if any data exists
    if (appScrollerMsg_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: appScrollerMsg_detail,
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
    console.error("Error fetching appScrollerMsg  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

exports.createScrollerData = asyncHandler(async (req, res) => {
  try {
    const { detail } = req.body;

    const newScrollerData = await appScrollerMsgModel.create({
      detail,
    });

    res.status(201).json({
      status: true,
      message: "Scroller data created successfully",
      data: newScrollerData,
    });
  } catch (error) {
    console.error("Error creating scroller data:", error.message);
    res.status(500).json({
      status: false,
      message: "Error inserting scroller data",
      error: error.message,
    });
  }
});

exports.getSingleScrollerData = asyncHandler(async (req, res) => {
  try {
    const { scroller_id } = req.params;

    const scrollerData = await appScrollerMsgModel.findOne({
      where: { scroller_id },
    });

    if (!scrollerData) {
      return res.status(404).json({
        status: false,
        message: "Scroller data not found",
      });
    }

    res.status(200).json({
      status: true,
      data: scrollerData,
    });
  } catch (error) {
    console.error("Error fetching scroller data:", error.message);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

exports.updateScrollerData = asyncHandler(async (req, res) => {
  try {
    const { scroller_id } = req.params;
    const { detail } = req.body;

    const updatedScrollerData = await appScrollerMsgModel.update(
      { detail },
      { where: { scroller_id } }
    );

    if (!updatedScrollerData[0]) {
      return res.status(404).json({
        status: false,
        message: "Scroller data not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Scroller data updated successfully",
    });
  } catch (error) {
    console.error("Error updating scroller data:", error.message);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});


exports.deleteScrollerData = asyncHandler(async (req, res) => {
  try {
    const { scroller_id } = req.params;

    const deletedScrollerData = await appScrollerMsgModel.destroy({
      where: { scroller_id },
    });

    if (!deletedScrollerData) {
      return res.status(404).json({
        status: false,
        message: "Scroller data not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Scroller data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scroller data:", error.message);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

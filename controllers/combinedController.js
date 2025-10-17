const asyncHandler = require("express-async-handler");
const studentMainModel = require("../models/studentModel");
const msgMasterModel = require("../models/msgMasterModel");
const sendedMsgModel = require("../models/sendedMsgModel");
const RepliedMessageModel = require("../models/RepliedMessageModel");

const schoolModel = require("../models/schoolMasterModel");
const Users = require("../models/userModel");


const moment = require("moment");

const { Op } = require("sequelize");


exports.getCombineHomePageDetail = asyncHandler(async (req, res) => {
  try {
    const { mobile_no } = req.params; // Only mobile_no is needed

    if (!mobile_no) {
      return res.status(400).json({
        status: false,
        message: "Mobile number is required in the URL",
      });
    }

    // Find parent/student where mobile_no matches any number in student_family_mobile_number
    const parent = await studentMainModel.findAll({
      where: {
        student_family_mobile_number: {
          [Op.like]: `%${mobile_no}%`, // matches any substring (comma/semicolon/space separated)
        },
      },
    });

    if (!parent || parent.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Parent not found with the given mobile number",
      });
    }

    // Get the school short name from the first matched student
    const sch_short_nm = parent[0].sch_short_nm;

    // Find the school by its short name
    const school = await schoolModel.findOne({
      where: { sch_short_nm },
    });

    if (!school) {
      return res.status(404).json({
        status: false,
        message: "School not found for this student",
      });
    }

    // App scroller message
    const appScrollerMsg = [
      {
        scroller_id: 18,
        detail: school.scroll_news_text.replace(/\n/g, ""), // Remove \n characters
      },
    ];

    // Send response in the same format as previous code
    res.status(200).json({
      status: true,
      message: "Data_Found",
      data: {
        appScrollerMsg,
        noticeMsg: parent, // include all matched parent/student records
        schoolDetail: school,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});



exports.getRelatedProfile = asyncHandler(async (req, res) => {
  try {
    const { mobilenumber } = req.query;

    // Validate the mobile number
    if (!mobilenumber || !mobilenumber.trim()) {
      return res.status(400).json({
        status: false,
        message: "Mobile number is required",
      });
    }

    // Trim and sanitize the mobile number
    const mobileNumber = mobilenumber.trim();

    // Fetch related profiles from the studentMainModel
    const relatedProfiles = await studentMainModel.findAll({
      where: {
        student_family_mobile_number: {
          [Op.like]: `%${mobileNumber}%`, // Check for a partial match
        },
      },
    });

    if (!relatedProfiles.length) {
      return res.status(404).json({
        status: false,
        message: "No profiles found for the given mobile number",
      });
    }

    // Assuming `sch_short_nm` is a field in relatedProfiles and you need to fetch the school details
    const schoolShortNames = relatedProfiles.map(
      (profile) => profile.sch_short_nm
    );

    // Fetch school details for the matched short names
    const schools = await schoolModel.findAll({
      where: {
        sch_short_nm: {
          [Op.in]: schoolShortNames,
        },
      },
    });

    if (!schools.length) {
      return res.status(404).json({
        status: false,
        message: "No schools found for the given profiles",
      });
    }

    // Send the data as a response
    res.status(200).json({
      status: true,
      message: "Data Found",
      data: relatedProfiles,
      schools,
    });
  } catch (error) {
    // Log the error and send a 500 response
    console.error("Error fetching details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});




exports.dashboardcount = asyncHandler(async (req, res) => {
  try {
    // Count the total rows in the student table
    const studentTotalRows = await studentMainModel.count();

    // Get the start and end dates for the current month
    const startOfMonth = moment().startOf("month").toDate(); // First day of the current month
    const endOfMonth = moment().endOf("month").toDate(); // Last day of the current month

    const sendedMsg_this_month = await sendedMsgModel.count({
      where: {
        sended_date: {
          [Op.between]: [startOfMonth, endOfMonth], // Get rows between the first and last day of the month
        },
      },
    });
    const replyMsg_this_month = await RepliedMessageModel.count({
      where: {
        reply_date_time: {
          [Op.between]: [startOfMonth, endOfMonth], // Get rows between the first and last day of the month
        },
      },
    });
    const msgTotalRows = await msgMasterModel.count();
    const distinctMobileCount = await Users.count({
      distinct: true,
      col: "mobile_no",
    });
    res.status(200).json({
      status: true,
      message: "Total rows counted successfully",
      data: {
        studentTotalRows: studentTotalRows,
        distinctMobileCount,
        msgTotalRows,
        sendedMsg_this_month,
        replyMsg_this_month,
      },
    });
  } catch (error) {
    console.error("Error fetching row count:", error.message);

    res.status(500).json({
      status: false,
      message: "An error occurred while counting rows",
      error: error.message,
    });
  }
});





exports.updateStudentTabStatus = asyncHandler(async (req, res) => {
  try {
    // Destructure variables from request body
    const { student_main_id, mobile, status } = req.body;

    // Validate input
    if (!mobile || !student_main_id || (status !== 0 && status !== 1)) {
      return res.status(400).json({
        status: false,
        message: "Mobile number, student ID, and status (0 or 1) are required",
      });
    }

    // Check if status is 0 and set mobile to null if true
    // let updatedMobile = mobile; // Use a new variable to store mobile value
    // if (status == 0) {
    //     updatedMobile = null; // Assign null to the new variable
    // }

    // Find the student entry
    const student = await studentMainModel.findOne({
      where: {
        student_main_id: student_main_id,
      },
    });

    // Check if student exists
    if (!student) {
      return res.status(404).json({
        status: false,
        message: "Student not found",
      });
    }

    // Update the student's tab_active_by_mobile and tab_active_status
    // student.tab_active_by_mobile = status == 0 ? null: mobile; // Use the new variable
    // student.tab_active_status = status; // 0 or 1
    // await student.save(); // Save the updated instance
    await studentMainModel.update(
      {
        tab_active_by_mobile: status === 0 ? null : mobile,
        tab_active_status: status, // 0 or 1
      },
      {
        where: { student_main_id: student_main_id },
      }
    );
    const updatedStudent = await studentMainModel.findOne({
      where: { student_main_id: student_main_id },
    });

    // Return success response
    return res.status(200).json({
      status: true,
      message: "Student status updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student status:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});


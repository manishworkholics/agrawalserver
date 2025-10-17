
const asyncHandler = require("express-async-handler");
const { Op } = require('sequelize');
const { studentMainDetailModel, feesDisplayModel } = require("../models/associations");

exports.getallfeesDisplayDetail = asyncHandler(async (req, res) => {
  try {
    // Get the current page and limit from query parameters (with default values)
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 records per page if not provided
    const offset = (page - 1) * limit; // Calculate offset for pagination

    // Fetch paginated records from the feesDisplayModel table
    const { count, rows: feesDisplay_detail } = await feesDisplayModel.findAndCountAll({
      limit,
      offset,
    });

    // Check if any data exists
    if (feesDisplay_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: feesDisplay_detail,
        pagination: {
          totalRecords: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          pageSize: limit,
        },
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
    console.error("Error fetching feesDisplay details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

// exports.getFeesDetailByMobile = asyncHandler(async (req, res) => {
//   try {
//     const { mobilenumber } = req.query;
//     if (!mobilenumber) {
//       return res.status(200).json({
//         status: false,
//         message: "Mobile number is required",
//       });
//     }

//     const mobileNumber = mobilenumber.trim();

//     const relatedProfiles = await studentMainDetailModel.findAll({
//       where: {
//         student_family_mobile_number: {
//           [Op.like]: `%${mobileNumber}%`,
//         },
//       },
//     });

//     const studentNumbers = relatedProfiles.map(student => student.student_number);

//     const allMatchingFees = await feesDisplayModel.findAll({
//       where: {
//         scholar_no: {
//           [Op.in]: studentNumbers,
//         },
//       },
//       order: [['fees_display_id', 'DESC']],
//       include: [
//         {
//           model: studentMainDetailModel,
//           as: 'student',
//         },
//       ],
//     });

//     // Inspect the retrieved data
//     console.log("All Matching Fees:", allMatchingFees);

//     if (allMatchingFees.length > 0) {
//       res.status(200).json({
//         status: true,
//         message: "Data_Found",
//         data: allMatchingFees,
//       });
//     } else {
//       res.status(200).json({
//         status: false,
//         message: "No_Data_Found",
//         data: null,
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching feesDisplay details:", error.message);
//     res.status(500).json({
//       status: false,
//       message: "An error occurred",
//       error: error.message,
//     });
//   }
// });

exports.getFeesDetailByMobile = asyncHandler(async (req, res) => {
  try {
    const { mobilenumber } = req.query;
    if (!mobilenumber) {
      return res.status(200).json({
        status: false,
        message: "Mobile number is required",
      });
    }

    const mobileNumber = mobilenumber.trim();

    // Fetch related student profiles
    const relatedProfiles = await studentMainDetailModel.findAll({
      where: {
        student_family_mobile_number: {
          [Op.like]: `%${mobileNumber}%`,
        },
      },
    });

    if (relatedProfiles.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No student data found for the provided mobile number",
      });
    }

    const studentNumbers = relatedProfiles.map(student => student.student_number);

    // Fetch fees details for the students
    const allMatchingFees = await feesDisplayModel.findAll({
      where: {
        scholar_no: {
          [Op.in]: studentNumbers,
        },
      },
      order: [['fees_display_id', 'DESC']],
      include: [
        {
          model: studentMainDetailModel,
          as: 'student',
        },
      ],
    });

    if (allMatchingFees.length > 0) {
      // If fees data exists
      return res.status(200).json({
        status: true,
        message: "Data_Found",
        data: allMatchingFees,
      });
    }

    // Dynamic data when no fees details are found
    const dynamicStudentData = relatedProfiles.map(student => ({
      fees_display_id: 0,
      scholar_no: student.student_number,
      session_detail: "",
      term: 0,
      outstandingfees: 0,
      duedate: "0",
      feesstatus: 0,
      createdAt: "",
      student: {
        student_main_id: student.student_main_id,
        student_name: student.student_name,
        student_dob: student.student_dob,
        student_email: student.student_email,
        scholar_type: student.scholar_type,
        color: student.color,
        student_number: student.student_number,
        student_family_mobile_number: student.student_family_mobile_number,
        tab_active_by_mobile: student.tab_active_by_mobile,
        tab_active_status: student.tab_active_status,
        sch_short_nm: student.sch_short_nm,
        noticeMsg: student.noticeMsg,
      },
    }));

    return res.status(200).json({
      status: true,
      message: "No fees data found, but student details are available",
      data: dynamicStudentData,
    });
  } catch (error) {
    console.error("Error fetching feesDisplay details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});





exports.getSingleFeesDisplayDetail = asyncHandler(async (req, res) => {
  try {
    // Extract the ID from request parameters
    const { id } = req.params;

    // Fetch the single record from the feesDisplayModel table using the ID
    const feesDisplay_detail = await feesDisplayModel.findOne({
      where: { fees_display_id: id }, // Replace 'fees_display_id' with your actual primary key field name
    });

    // Check if data exists for the given ID
    if (feesDisplay_detail) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: feesDisplay_detail,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No_Data_Found",
        data: null,
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching feesDisplay details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});



exports.addfeesDisplay = asyncHandler(async (req, res) => {
  try {
    const { data: feesDetails, deleteExisting } = req.body; // Extract fees data and deleteExisting flag

    if (!feesDetails || feesDetails.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data provided for import",
      });
    }

    // If deleteExisting flag is true, delete all existing records
    if (deleteExisting) {
      await feesDisplayModel.destroy({
        where: {}, // Deletes all records from the table
      });
      console.log("All existing fees records have been deleted.");
    }

    // Process each record in the feesDetails array
    for (let i = 0; i < feesDetails.length; i++) {
      const item = feesDetails[i];


      await feesDisplayModel.create({
        scholar_no: item.scholar_no,
        session_detail: item.session_detail,
        term: item.term,
        outstandingfees: item.outstandingfees,
        duedate: item.duedate,
        feesstatus: item.feesstatus || 0, // Default to 0 if not provided
        createdAt: new Date(),
      });
      console.log(
        `Inserted new fees record for scholar_no: ${item.scholar_no}, session_detail: ${item.session_detail}`
      );
    }

    // Respond with success message
    res.status(200).json({
      status: true,
      message: "Fees details imported successfully",
    });

  } catch (error) {
    // Handle any errors during processing
    console.error("Error importing fees details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred during import",
      error: error.message,
    });
  }

});


// Get a single feesDisplay by ID
exports.getSinglefeesDisplayDetail = asyncHandler(async (req, res) => {
  const { feesDisplayid } = req.params;

  try {
    const feesDisplay = await feesDisplayModel.findByPk(feesDisplayid);

    if (feesDisplay) {
      res.status(200).json({
        status: true,
        message: "feesDisplay found",
        data: feesDisplay,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "feesDisplay not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching feesDisplay",
      error: error.message,
    });
  }
});

// Update an existing feesDisplay
exports.updatefeesDisplay = asyncHandler(async (req, res) => {
  const { feesDisplayid } = req.params;
  const { title } = req.body;

  try {
    const feesDisplay = await feesDisplayModel.findByPk(feesDisplayid);

    if (feesDisplay) {
      feesDisplay.title = title;
      await feesDisplay.save();

      res.status(200).json({
        status: true,
        message: "feesDisplay updated successfully",
        data: feesDisplay,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "feesDisplay not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error updating feesDisplay",
      error: error.message,
    });
  }
});


exports.deleteSingleFeesRecord = asyncHandler(async (req, res) => {
  try {
    const { scholar_no, session_detail } = req.body; // Assuming these are sent in the request body

    // Validate input
    if (!scholar_no || !session_detail) {
      return res.status(400).json({
        status: false,
        message: "scholar_no and session_detail are required to delete a record",
      });
    }

    // Find and delete the record
    const deletedRecord = await feesDisplayModel.destroy({
      where: {
        scholar_no: scholar_no,
        session_detail: session_detail,
      },
    });

    if (deletedRecord) {
      // If the record is deleted successfully
      res.status(200).json({
        status: true,
        message: `Record for scholar_no: ${scholar_no}, session_detail: ${session_detail} has been deleted successfully`,
      });
    } else {
      // If no record was found for the given details
      res.status(404).json({
        status: false,
        message: `No record found for scholar_no: ${scholar_no}, session_detail: ${session_detail}`,
      });
    }
  } catch (error) {
    // Handle errors
    console.error("Error deleting single fees record:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred while deleting the record",
      error: error.message,
    });
  }
});

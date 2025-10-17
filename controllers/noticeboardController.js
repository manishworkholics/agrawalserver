
const asyncHandler = require("express-async-handler");
const NoticeBoardModel = require("../models/noticeBoardModel.js");
const studentMainModel = require("../models/studentModel");
const { Op } = require("sequelize");

//For Android App
exports.getNoticeBoardDetail = asyncHandler(async (req, res) => {
  try {
    // Fetch all records from the NoticeBoard table
    const noticeboard = await NoticeBoardModel.findAll();

    // Check if any data exists
    if (noticeboard.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: noticeboard,
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
    console.error("Error fetching notice board details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

// exports.getNoticeBoardDetails = asyncHandler(async (req, res) => {
//   try {
//     const { mobilenumber } = req.query;

//     // Validate the mobile number
//     if (!mobilenumber || !mobilenumber.trim()) {
//       return res.status(400).json({
//         status: false,
//         message: "Mobile number is required",
//       });
//     }

//     // Trim and sanitize the mobile number
//     const mobileNumber = mobilenumber.trim();

//     // Fetch related profiles from the studentMainModel
//     const relatedProfiles = await studentMainModel.findAll({
//       where: {
//         student_family_mobile_number: {
//           [Op.like]: `%${mobileNumber}%`, // Check for a partial match
//         },
//       },
//     });

//     if (!relatedProfiles || relatedProfiles.length === 0) {
//       return res.status(404).json({
//         status: false,
//         message: "No profiles found for the given mobile number",
//       });
//     }

//     // Assuming `sch_short_nm` is a field in relatedProfiles and you need to fetch the school details
//     const schoolShortNames = relatedProfiles.map(
//       (profile) => profile.sch_short_nm
//     );

//     // Fetch all records from the NoticeBoard table where school_id matches
//     const noticeboard = await NoticeBoardModel.findAll({
//       where: {
//         school_id: {
//           [Op.in]: schoolShortNames, // Use IN operator for array matching
//         },
//       },
//     });

//     // Check if any data exists
//     if (noticeboard && noticeboard.length > 0) {
//       return res.status(200).json({
//         status: true,
//         message: "Data_Found",
//         data: noticeboard,
//       });
//     } else {
//       return res.status(200).json({
//         status: false,
//         message: "No_Data_Found",
//         data: null,
//       });
//     }
//   } catch (error) {
//     // Log the error to the console for debugging
//     console.error("Error fetching notice board details:", error);

//     // Send an error response to the client
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while fetching notice board details.",
//       error: error.message, // Return the error message for debugging (optional)
//     });
//   }
// });

// exports.getNoticeBoardDetails = asyncHandler(async (req, res) => {
//   try {
//     const { mobilenumber } = req.query;

//     // Validate the mobile number
//     if (!mobilenumber || !mobilenumber.trim()) {
//       return res.status(400).json({
//         status: false,
//         message: "Mobile number is required",
//       });
//     }

//     // Trim and sanitize the mobile number
//     const mobileNumber = mobilenumber.trim();

//     // Fetch related profiles from the studentMainModel
//     const relatedProfiles = await studentMainModel.findAll({
//       where: {
//         student_family_mobile_number: {
//           [Op.like]: `%${mobileNumber}%`, // Check for a partial match
//         },
//       },
//     });

//     if (!relatedProfiles || relatedProfiles.length === 0) {
//       return res.status(404).json({
//         status: false,
//         message: "No profiles found for the given mobile number",
//       });
//     }

//     // Assuming `sch_short_nm` is a field in relatedProfiles and you need to fetch the school details
//     const schoolShortNames = relatedProfiles.map(
//       (profile) => profile.sch_short_nm
//     );

//     // Fetch all records from the NoticeBoard table where school_id matches or is null
//     const noticeboard = await NoticeBoardModel.findAll({
//       where: {
//         [Op.or]: [
//           { school_id: { [Op.in]: schoolShortNames } }, // Match school IDs
//           { school_id: null }, // Or fall back to null school ID
//         ],
//       },
//     });

//     // Check if any data exists
//     if (noticeboard && noticeboard.length > 0) {
//       return res.status(200).json({
//         status: true,
//         message: "Data_Found",
//         data: noticeboard,
//       });
//     } else {
//       return res.status(200).json({
//         status: false,
//         message: "No_Data_Found",
//         data: null,
//       });
//     }
//   } catch (error) {
//     // Log the error to the console for debugging
//     console.error("Error fetching notice board details:", error);

//     // Send an error response to the client
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while fetching notice board details.",
//       error: error.message, // Return the error message for debugging (optional)
//     });
//   }
// });


exports.getNoticeBoardDetails = asyncHandler(async (req, res) => {
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

    // If no related profiles are found, fetch data where school_id is null
    if (!relatedProfiles || relatedProfiles.length === 0) {
      const noticeboardFallback = await NoticeBoardModel.findAll({
        where: {
          school_id: "null",
        },
      });

      if (noticeboardFallback && noticeboardFallback.length > 0) {
        return res.status(200).json({
          status: true,
          message: "No profiles found, returning data for null school_id",
          data: noticeboardFallback,
        });
      } else {
        return res.status(200).json({
          status: false,
          message: "No profiles and no notice board data found",
          data: null,
        });
      }
    }

    // Extract school short names if related profiles are found
    const schoolShortNames = relatedProfiles.map(
      (profile) => profile.sch_short_nm
    );

    // Fetch all records from the NoticeBoard table where school_id matches or is null
    const noticeboard = await NoticeBoardModel.findAll({
      where: {
        [Op.or]: [
          { school_id: { [Op.in]: schoolShortNames } }, // Match school IDs
          { school_id: "null"}, // Or fall back to null school ID
        ],
      },
    });

    // Check if any data exists
    if (noticeboard && noticeboard.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Data_Found",
        data: noticeboard,
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "No_Data_Found",
        data: null,
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching notice board details:", error);

    // Send an error response to the client
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching notice board details.",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});


exports.getAllNoticeBoardDetail = asyncHandler(async (req, res) => {
  try {
    // Extract page and limit from query parameters
    const { page, limit } = req.query;

    // Determine if pagination is required
    const isPagination = page && limit;
    let noticeboard;
    let totalRecords;

    if (isPagination) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Fetch total record count for calculating total pages
      totalRecords = await NoticeBoardModel.count();

      // Fetch paginated records from the NoticeBoardModel
      noticeboard = await NoticeBoardModel.findAll({
        limit: limitNum,
        offset: offset,
      });
    } else {
      // Fetch all records if pagination is not specified
      noticeboard = await NoticeBoardModel.findAll();

      // Set total record count as the number of fetched records
      totalRecords = noticeboard.length;
    }

    // Check if any data exists
    if (noticeboard.length > 0) {
      const totalPages = isPagination
        ? Math.ceil(totalRecords / parseInt(limit, 10))
        : null; // Total pages only relevant with pagination

      res.status(200).json({
        status: true,
        message: "Data Found",
        data: noticeboard,
        pagination: isPagination
          ? {
            currentPage: parseInt(page, 10),
            totalPages: totalPages,
            totalRecords: totalRecords,
            limit: parseInt(limit, 10),
          }
          : null, // No pagination details if not applicable
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No Data Found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching notice board details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});



// Add a new document
exports.addDocument = asyncHandler(async (req, res) => {
  const { title, document_type, document_link, thumbnails, school_id } = req.body;

  try {
    const newDocument = await NoticeBoardModel.create({
      title,
      document_type,
      document_link, thumbnails, school_id
    });

    res.status(201).json({
      status: true,
      message: "Document added successfully",
      data: newDocument,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error adding document",
      error: error.message,
    });
  }
});

// Get a single document by ID
exports.getSingleDocumentDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const document = await NoticeBoardModel.findByPk(id);

    if (document) {
      res.status(200).json({
        status: true,
        message: "Document found",
        data: document,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Document not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching document",
      error: error.message,
    });
  }
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Find the document by its primary key (ID)
    const document = await NoticeBoardModel.findByPk(id);

    if (!document) {
      return res.status(404).json({
        status: false,
        message: "Document not found",
      });
    }

    // Delete the document
    await document.destroy();

    res.status(200).json({
      status: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error deleting document",
      error: error.message,
    });
  }
});


// Update an existing document
exports.updateDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, document_type, document_link, thumbnails, school_id } = req.body;

  try {
    const document = await NoticeBoardModel.findByPk(id);

    if (document) {
      document.title = title;
      document.document_type = document_type;
      document.document_link = document_link;
      document.thumbnails = thumbnails;
      document.school_id = school_id;
      await document.save();

      res.status(200).json({
        status: true,
        message: "Document updated successfully",
        data: document,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Document not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error updating document",
      error: error.message,
    });
  }
});
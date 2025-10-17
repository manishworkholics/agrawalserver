const asyncHandler = require("express-async-handler");
const parentModel = require("../models/parentModel");
const Users = require("../models/userModel");
const student_main_detailModel = require("../models/studentModel");
const { Op } = require("sequelize");
// ............................insert and delete................




exports.insertScholarRecord = asyncHandler(async (req, res) => {
  try {
    const { data: scholar_detail = [], action } = req.body; // default empty array

    // If blank Excel, delete all students
    if (!Array.isArray(scholar_detail) || scholar_detail.length === 0) {
      await student_main_detailModel.destroy({ where: {} });

      console.log("Blank Excel uploaded – deleted all student records");
      return res.status(200).json({
        status: true,
        message: "Blank Excel uploaded – all student records deleted",
        data: [],
      });
    }

    // Preprocess incoming data
    const formattedData = scholar_detail.map((item) => {
      let scholarType;
      let scholarNo = item.stdn_id;

      if (!item.stdn_id) {
        scholarType = "TEACHER";
        scholarNo = Math.floor(10000000 + Math.random() * 90000000);
      } else if (isNaN(item.stdn_id)) {
        scholarType = item.stdn_id;
      } else {
        scholarType = "STUDENT";
      }

      return {
        sch_short_nm: item.sch_short || "",
        mobile_no: item.mobile_no || "",
        scholar_no: scholarNo,
        name: item.stdn_nm || "",
        scholar_dob: item.birth_dt || null,
        scholar_email: item.fth_email || "",
        scholar_type: scholarType,
        noticeMsg: item.noticeMsg || "",
        remark: item.remark || "",
      };
    });

    // Merge multiple entries of same student_number (combine mobile numbers)
    const mergedDataMap = new Map();
    for (const item of formattedData) {
      if (!mergedDataMap.has(item.scholar_no)) {
        mergedDataMap.set(item.scholar_no, { ...item, mobileNumbers: new Set() });
      }
      const studentEntry = mergedDataMap.get(item.scholar_no);
      if (item.mobile_no) {
        const mobileList = item.mobile_no.split(/[,; ]+/).map((num) => num.trim());
        for (const num of mobileList) {
          if (num.length >= 10) studentEntry.mobileNumbers.add(num);
        }
      }
    }

    const mergedData = Array.from(mergedDataMap.values()).map((item) => ({
      ...item,
      mobile_no: Array.from(item.mobileNumbers).join(","),
    }));

    // ----- CASE 1: delete_and_import -----
    if (action === "delete_and_import") {
      await student_main_detailModel.destroy({ where: {} });
      console.log("All existing students deleted (delete_and_import mode)");

      for (const item of mergedData) {
        const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");

        await student_main_detailModel.create({
          color,
          student_number: item.scholar_no,
          student_name: item.name,
          student_family_mobile_number: item.mobile_no,
          student_dob: item.scholar_dob,
          student_email: item.scholar_email,
          scholar_type: item.scholar_type,
          noticeMsg: item.noticeMsg,
          remark: item.remark,
          sch_short_nm: item.sch_short_nm,
          createdAt: new Date(),
        });
      }

      return res.status(200).json({
        status: true,
        message: "All old records deleted and new students imported successfully",
        data: mergedData,
      });
    }

    // ----- CASE 2: Normal import (update or insert) -----
    for (const item of mergedData) {
      const existingStudent = await student_main_detailModel.findOne({
        where: { student_number: item.scholar_no },
      });

      if (existingStudent) {
        // Merge old + new mobile numbers
        const existingMobileNumbers = existingStudent.student_family_mobile_number
          ? existingStudent.student_family_mobile_number.split(/[,; ]+/).map((n) => n.trim())
          : [];

        const newMobileNumbers = item.mobile_no
          ? item.mobile_no.split(/[,; ]+/).map((n) => n.trim())
          : [];

        const allUniqueNumbers = Array.from(new Set([...existingMobileNumbers, ...newMobileNumbers]))
          .filter((n) => n.length >= 10);

        await existingStudent.update({
          student_family_mobile_number: allUniqueNumbers.join(","),
          noticeMsg: item.noticeMsg,
          remark: item.remark,
          student_name: item.name,
          student_dob: item.scholar_dob,
          student_email: item.scholar_email,
          scholar_type: item.scholar_type,
          sch_short_nm: item.sch_short_nm,
        });

        console.log(`Updated student: ${item.name} (${item.scholar_no})`);
      } else {
        const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");

        await student_main_detailModel.create({
          color,
          student_number: item.scholar_no,
          student_name: item.name,
          student_family_mobile_number: item.mobile_no,
          student_dob: item.scholar_dob,
          student_email: item.scholar_email,
          scholar_type: item.scholar_type,
          noticeMsg: item.noticeMsg,
          remark: item.remark,
          sch_short_nm: item.sch_short_nm,
          createdAt: new Date(),
        });

        console.log(`Inserted new student: ${item.name} (${item.scholar_no})`);
      }
    }

    res.status(200).json({
      status: true,
      message: "Records inserted/updated successfully",
      data: mergedData,
    });
  } catch (error) {
    console.error("Error inserting scholar records:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});



//BY Active User
exports.get_full_list_app_active_users_list = asyncHandler(async (req, res) => {
  try {
    // Extract pagination parameters from the query
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const offset = (page - 1) * limit; // Calculate the offset for pagination

    // Extract filter parameters from the query
    const isActive = req.query.active; // '1' for active, '0' for inactive, 'all' for no filter
    const isVerified = req.query.otpVerified; // '1' for verified, '0' for not verified, 'all' for no filter

    // Create an object for the 'where' clause
    let whereClause = {};

    // Apply filters based on the query parameters
    if (isActive === "1") {
      whereClause.active_by = 1; // Active users only
    } else if (isActive === "0") {
      whereClause.active_by = 0; // Inactive users only
    }

    if (isVerified === "1") {
      whereClause.is_verified = 1; // OTP verified
    } else if (isVerified === "0") {
      whereClause.is_verified = 0; // OTP not verified
    }

    // Fetch records with pagination and filtering
    const scholar_detail = await Users.findAll({
      where: whereClause,
      order: [
        ["parents_id", "DESC"], // Replace 'parents_id' with the column you want to sort by
      ],
      limit: limit,
      offset: offset,
    });

    // Fetch the total count of records
    const totalCount = await Users.count({ where: whereClause }); // Get total count of records for pagination
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit); // Calculate total pages based on count and limit

    // Check if any data exists
    if (scholar_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: scholar_detail,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          limit: limit,
          totalCount: totalCount,
        },
        // Include total count in the response
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No_Data_Found",
        data: [],
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          limit: limit,
          totalCount: 0,
        },
        // Return total count as 0 if no data found
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching scholar details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});


//ye parent main ki api heee
exports.getscholarDetail = asyncHandler(async (req, res) => {
  try {
    const { page, limit } = req.query;
    const isPagination = page && limit;
    let scholar_detail;
    let totalRecords;

    if (isPagination) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Count only active records
      totalRecords = await student_main_detailModel.count({
        where: { is_active: 1 },
      });

      // Fetch only active records with pagination
      scholar_detail = await student_main_detailModel.findAll({
        where: { is_active: 1 },
        order: [["student_main_id", "DESC"]],
        limit: limitNum,
        offset: offset,
      });
    } else {
      // Fetch all active records if pagination is not specified
      scholar_detail = await student_main_detailModel.findAll({
        where: { is_active: 1 },
        order: [["student_main_id", "DESC"]],
      });

      totalRecords = scholar_detail.length;
    }

    if (scholar_detail.length > 0) {
      const totalPages = isPagination
        ? Math.ceil(totalRecords / parseInt(limit, 10))
        : null;

      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: scholar_detail,
        pagination: isPagination
          ? {
            currentPage: parseInt(page, 10),
            totalPages,
            totalRecords,
            limit: parseInt(limit, 10),
          }
          : null,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No_Data_Found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching scholar details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});


exports.getlist_main_student_detail = asyncHandler(async (req, res) => {
  try {
    // Extract pagination parameters from the query
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to limit of 10 if not provided
    const offset = (page - 1) * limit; // Calculate the offset for pagination

    // Fetch records with pagination
    const student_main_detail = await student_main_detailModel.findAll({
      order: [
        ["student_main_id", "DESC"], // Sort by student_main_id in descending order
      ],
      limit: limit,
      offset: offset,
    });

    // Fetch the total count of records
    const totalCount = await student_main_detailModel.count(); // Get total count of records for pagination

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages; // Check if there are more pages

    // Check if any data exists
    if (student_main_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data Found",
        data: student_main_detail,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalCount,
          hasMore: hasMore, // Indicates if more data is available
        },
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No Data Found",
        data: [],
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalCount,
          hasMore: false, // No more data available if none is found
        },
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching student details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});



exports.getlist_main_student_detail_two = asyncHandler(async (req, res) => {
  try {
    const { sch_short_nm } = req.query;

    // Always include is_active = 1
    let whereCondition = { is_active: 1 };

    if (sch_short_nm) {
      // Always convert into array, even for single value
      const shortNames = sch_short_nm.split(",").map((val) => val.trim());

      whereCondition.sch_short_nm = {
        [Op.in]: shortNames,
      };
    }

    const student_main_detail = await student_main_detailModel.findAll({
      where: whereCondition,
      order: [["student_main_id", "DESC"]],
    });

    if (student_main_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data Found",
        data: student_main_detail,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No Data Found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching student details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});





exports.get_MainList_ScholarDetail_DropDown = asyncHandler(async (req, res) => {
  try {
    const { sch_short_nm } = req.query; // ✅ Get query param

    // Build dynamic where condition
    let whereCondition = { is_active: 1 };
    if (sch_short_nm) {
      whereCondition.sch_short_nm = sch_short_nm; // ✅ Filter by sch_short_nm if provided
    }

    const scholar_main_detail = await student_main_detailModel.findAll({
      attributes: ["student_main_id", "student_number", "student_family_mobile_number", "sch_short_nm"],
      where: whereCondition,
      order: [["student_main_id", "DESC"]],
    });

    // Count only filtered + active records
    const totalCount = await student_main_detailModel.count({
      where: whereCondition,
    });

    if (scholar_main_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: scholar_main_detail,
        totalCount: totalCount,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No_Data_Found",
        data: null,
        totalCount: 0,
      });
    }
  } catch (error) {
    console.error("Error fetching scholar details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});




exports.bulkUpdateScholars = asyncHandler(async (req, res) => {
  try {
    // Get the array of scholar IDs and the new welcome message from the request body
    const { scholarNos, noticeMsg } = req.body;

    // Check if scholarNos and noticeMsg are provided
    if (!scholarNos || !Array.isArray(scholarNos) || scholarNos.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid data. 'scholarNos' should be an array and 'noticeMsg' is required.",
      });
    }

    // Perform the bulk update using Sequelize's update method
    const updateResult = await student_main_detailModel.update(
      { noticeMsg }, // Fields to update
      {
        where: {
          scholar_no: scholarNos, // Filter by scholar_no array
        },
      }
    );

    // Check if any records were updated
    if (updateResult[0] > 0) {
      res.status(200).json({
        status: true,
        message: "Scholars updated successfully",
        updatedCount: updateResult[0],
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No scholars found with the provided IDs",
      });
    }
  } catch (error) {
    console.error("Error updating scholars:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred during the update",
      error: error.message,
    });
  }
});

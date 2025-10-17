const adminModel = require("../models/adminModel.js");
const schoolModel = require("../models/schoolMasterModel");
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const asyncHandler = require("express-async-handler");
const MAIN_URL = process.env.MAIN_URL;
const { generateToken } = require('../middlewares/jwtUtils');


exports.videoUpload = asyncHandler(async (req, res, next) => {
  try {
    const Url = MAIN_URL + "Uploads/video/" + req.file.filename;
    const filename = req.file.filename;
    res.status(200).json({
      status: "success",
      message: "Created Successfully",
      filename: filename,
      url: Url,
    });
  } catch (error) {
    next(appErr(error.message));
  }
});


exports.imageUpload = asyncHandler(async (req, res, next) => {
  try {
    const Url = process.env.MAIN_URL + "Uploads/image/" + req.file.filename;
    const filename = req.file.filename;

    res.status(200).json({
      status: "success",
      message: "Created Successfully",
      imagename: filename,
      url: Url,
    });
  } catch (error) {
    next(appErr(error.message));
  }
});

exports.pdfUpload = asyncHandler(async (req, res, next) => {
  try {
    const Url = process.env.MAIN_URL + "Uploads/pdf/" + req.file.filename;
    const filename = req.file.filename;

    res.status(200).json({
      status: "success",
      message: "Created Successfully",
      imagename: filename,
      url: Url,
    });
  } catch (error) {
    next(appErr(error.message));
  }
});

exports.createAdmin = asyncHandler(async (req, res) => {
  try {
    const {
      full_name,
      adminuser_name,
      admin_password,
      is_active,
      admin_type,
      mobile_no,
      added_admin_id,
      parent_admin_id,
      school_id
    } = req.body;

    const schoolIdsString = school_id.join(','); // Convert array to string "1,2,3"

    // Check if the username already exists
    const existingUser = await adminModel.findOne({
      where: { adminuser_name }
    });

    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "Username already exists. Please choose another username.",
      });
    }

    // Check if the mobile number already exists
    const existingMobile = await adminModel.findOne({
      where: { mobile_no }
    });

    if (existingMobile) {
      return res.status(400).json({
        status: false,
        message: "Mobile number already exists. Please use another mobile number.",
      });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin_password, salt);

    // Create the new admin record
    const newAdmin = await adminModel.create({
      full_name,
      adminuser_name,
      admin_password,
      admin_password_encrypted: hashedPassword, // Save the hashed password
      school_id: schoolIdsString,
      is_active,
      admin_type,
      mobile_no,
      added_date: new Date(),
      added_admin_id,
      parent_admin_id,
    });

    res.status(200).json({
      status: true,
      message: "New admin created successfully",
      data: newAdmin,
    });

  } catch (error) {
    console.error("Error creating new admin:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "Error inserting admin record",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});


exports.loginAdmin = asyncHandler(async (req, res) => {
  const { adminuser_name, admin_password } = req.body;

  try {
    // Find user by username
    const user = await adminModel.findOne({ where: { adminuser_name: adminuser_name } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(admin_password, user.admin_password_encrypted);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Parse the school IDs from `school_id` field if present
    const schoolIds = user.school_id
      ? user.school_id.split(',').map(id => parseInt(id.trim()))
      : [];

    // Fetch school details based on parsed school IDs
    const schoolDetails = schoolIds.length
      ? await schoolModel.findAll({
        where: { sch_id: { [Op.in]: schoolIds } },
      })
      : [];

    // Generate token
    const tokenuser = {
      id: user.admin_id,
      role: 'Admin',
    };
    const token = generateToken(tokenuser);

    // Successful login, send response with school details
    res.status(200).json({
      message: 'Login successful',
      admin_id: user.admin_id,
      data: user,
      token,
      schoolDetails, // Include the school details in the response
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



exports.updatePassword = asyncHandler(async (req, res) => {
  try {
    const { admin_id, old_password, new_password } = req.body;
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Step 1: Find the admin by admin_id
    const admin = await adminModel.findOne({
      where: { admin_id: admin_id },
    });

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    // Step 2: Check if the old password matches the stored password
    if (admin.admin_password !== old_password) {
      return res.status(400).json({
        status: false,
        message: "Old password is incorrect",
      });
    }

    // Step 3: Update the password with the new one
    await adminModel.update(
      { admin_password: new_password, admin_password_encrypted: hashedPassword }, // Update password
      { where: { admin_id: admin_id } } // Match by admin_id
    );

    return res.status(200).json({
      status: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching appScrollerMsg  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "Error Updating admin record",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

exports.updateProfileDetail = asyncHandler(async (req, res) => {
  try {
    const { admin_id } = req.params; // Get the admin_id from the route parameter
    const {
      full_name,
      adminuser_name,
      admin_password,
      is_active,
      admin_type,
      mobile_no,
      added_admin_id,
      parent_admin_id, school_id,
    } = req.body; // Get the admin details from the request body
    // Hash the password before saving
    const schoolIdsString = school_id.join(','); // Convert array to string "1,2,3"

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin_password, salt);

    // Step 1: Find the admin by admin_id
    const admin = await adminModel.findOne({
      where: { admin_id: admin_id },
    });

    // Step 2: Check if the admin exists
    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    // Step 3: Update the admin details
    await adminModel.update(
      {
        full_name: full_name,
        adminuser_name: adminuser_name,
        admin_password: admin_password,
        admin_password_encrypted: hashedPassword,
        is_active: is_active, school_id: schoolIdsString,
        admin_type: admin_type,
        mobile_no: mobile_no,
        added_admin_id: added_admin_id,
        parent_admin_id: parent_admin_id,
      },
      { where: { admin_id: admin_id } } // Match by admin_id
    );

    return res.status(200).json({
      status: true,
      message: "Admin details updated successfully",
    });
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching appScrollerMsg  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "Error Updating admin record",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});


exports.getAllAdmin = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch admin records with pagination
    const allAdmin = await adminModel.findAll({
      where: { is_deleted: 0 },
      limit,
      offset,
      order: [['admin_id', 'DESC']],
    });

    if (allAdmin.length > 0) {
      // Fetch related school details for each admin entry
      for (let admin of allAdmin) {
        const schoolIds = admin.school_id ? admin.school_id.split(',').map(id => parseInt(id.trim())) : [];

        const schoolDetails = schoolIds.length
          ? await schoolModel.findAll({
            where: { sch_id: { [Op.in]: schoolIds } },
          })
          : [];

        // Attach the school details to the admin data
        admin.dataValues.schoolDetails = schoolDetails;
      }
    }

    const totalCount = await adminModel.count({ where: { is_deleted: 0 } });
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      status: true,
      message: allAdmin.length > 0 ? "Admin Found" : "No Data Found",
      data: allAdmin,
      pagination: {
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching admin details:", error.message);
    res.status(500).json({
      status: false,
      message: "Error fetching admin record",
      error: error.message,
    });
  }
});


// exports.getSingleAdmin = asyncHandler(async (req, res) => {
//   try {
//     const adminId = req.params.id;

//     // Fetch the single admin record
//     const singleAdmin = await adminModel.findOne({
//       where: { admin_id: adminId },
//     });

//     if (singleAdmin) {
//       // Parse the school IDs from `school_id` field if present
//       const schoolIds = singleAdmin.school_id
//         ? singleAdmin.school_id.split(',').map(id => parseInt(id.trim()))
//         : [];

//       // Fetch school details based on parsed school IDs
//       const schoolDetails = schoolIds.length
//         ? await schoolModel.findAll({
//           where: { sch_id: { [Op.in]: schoolIds } },
//         })
//         : [];

//       // Attach the school details to the admin data
//       singleAdmin.dataValues.schoolDetails = schoolDetails;

//       res.status(200).json({
//         status: true,
//         message: "Data Found",
//         data: singleAdmin,
//         length: schoolDetails.length, // Number of linked schools
//       });
//     } else {
//       res.status(200).json({
//         status: false,
//         message: "No Data Found",
//         data: null,
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching admin details:", error.message);

//     res.status(500).json({
//       status: false,
//       message: "Error fetching admin record",
//       error: error.message,
//     });
//   }
// });




exports.getSingleAdmin = asyncHandler(async (req, res) => {
  try {
    const adminId = parseInt(req.params.id, 10);

    // Fetch the single admin record
    const singleAdmin = await adminModel.findOne({
      where: { admin_id: adminId, is_deleted: 0 },
    });

    if (!singleAdmin) {
      return res.status(200).json({
        status: false,
        message: "No Data Found",
        data: null,
      });
    }

    // Parse and fetch current admin's schools
    const currentSchoolIds = singleAdmin.school_id
      ? singleAdmin.school_id.split(",").map((id) => parseInt(id.trim()))
      : [];

    const currentSchoolDetails = currentSchoolIds.length
      ? await schoolModel.findAll({
          where: { sch_id: { [Op.in]: currentSchoolIds } },
        })
      : [];

    // Recursive function to fetch subordinates
    const fetchSubordinates = async (adminIds, visited = new Set()) => {
      const newAdminIds = adminIds.filter((id) => !visited.has(id));

      if (newAdminIds.length === 0) return [];

      newAdminIds.forEach((id) => visited.add(id));

      const subordinates = await adminModel.findAll({
        where: {
          parent_admin_id: { [Op.in]: newAdminIds },
          is_deleted: 0,
        },
      });

      if (subordinates.length === 0) return [];

      const subordinateIds = subordinates.map((sub) => sub.admin_id);

      const deeperSubordinates = await fetchSubordinates(subordinateIds, visited);

      return [...subordinates, ...deeperSubordinates];
    };

    // Fetch all subordinates
    const allSubordinates = await fetchSubordinates([adminId]);

    // Collect school IDs from subordinates
    const subordinateSchoolIds = (
      await Promise.all(
        allSubordinates.map(async (sub) => {
          if (sub.school_id) {
            return sub.school_id.split(",").map((id) => parseInt(id.trim()));
          }
          return [];
        })
      )
    ).flat();

    const allSchoolIds = [...new Set([...currentSchoolIds, ...subordinateSchoolIds])]; // Unique IDs

    // Fetch all schools (current + subordinates)
    const allSchoolDetails = allSchoolIds.length
      ? await schoolModel.findAll({
          where: { sch_id: { [Op.in]: allSchoolIds } },
        })
      : [];

    // Attach subordinate and school details to the response
    singleAdmin.dataValues.schoolDetails = currentSchoolDetails;
    singleAdmin.dataValues.subordinateDetails = allSubordinates;
    singleAdmin.dataValues.allSchoolDetails = allSchoolDetails;

    res.status(200).json({
      status: true,
      message: "Data Found",
      data: singleAdmin,
      schoolCount: allSchoolDetails.length, // Total number of schools
    });
  } catch (error) {
    console.error("Error fetching admin details:", error.message);

    res.status(500).json({
      status: false,
      message: "Error fetching admin record",
      error: error.message,
    });
  }
});







exports.updatePasswordAdmin = asyncHandler(async (req, res) => {
  try {
    const adminId = req.params.id;

    const singleAdmin = await adminModel.findOne({
      where: { admin_id: adminId },
    });

    if (singleAdmin) {
      res.status(200).json({
        status: true,
        message: "Data Found",
        data: singleAdmin,
        length: singleAdmin.length,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No DataFound",
        data: singleAdmin,
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching appScrollerMsg  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "Error inserting admin record",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});


exports.deleteAdmin = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
 
    // Find the admin by ID
    const adminDetail = await adminModel.findOne({
      where: { admin_id: id }
    });
 
    if (!adminDetail) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
        data: null
      });
    }
 
    // Permanently delete the admin record
    await adminModel.destroy({
      where: { admin_id: id }
    });
 
    res.status(200).json({
      status: true,
      message: "Admin successfully deleted",
      data: {
        admin_id: id
      }
    });
  } catch (error) {
    console.error("Error deleting admin:", error.message);
 
    res.status(500).json({
      status: false,
      message: "An error occurred while deleting the admin",
      error: error.message
    });
  }
});




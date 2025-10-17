// controllers/teacherController.js
const asyncHandler = require("express-async-handler");
const teacherModel = require("../models/TeacherNumberModel"); 


// Get all teachers
exports.getAllTeachers = asyncHandler(async (req, res) => {
  try {
    const teachers = await teacherModel.findAll({
      attributes: ['teacherId', 'name', 'mobileNo'], // Specify the fields to retrieve
    });

    if (teachers.length > 0) {
      res.status(200).json({
        status: true,
        message: "Teachers Found",
        data: teachers,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No Teachers Found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching teacher details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// Get single teacher by ID
exports.getSingleTeacher = asyncHandler(async (req, res) => {
  try {
    const teacherId = req.params.id; // Get the ID from the URL params
    const teacher = await teacherModel.findByPk(teacherId, {
      attributes: ['teacherId', 'name', 'mobileNo'], // Specify the fields to retrieve
    });

    if (teacher) {
      res.status(200).json({
        status: true,
        message: "Teacher Found",
        data: teacher,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Teacher Not Found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching teacher details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// Create a new teacher
exports.createTeacher = asyncHandler(async (req, res) => {
  try {
    const { name, mobileNo } = req.body; // Get data from request body
    const newTeacher = await teacherModel.create({ name, mobileNo });

    res.status(201).json({
      status: true,
      message: "Teacher Created",
      data: newTeacher,
    });
  } catch (error) {
    console.error("Error creating teacher:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// Update teacher by ID
exports.updateTeacher = asyncHandler(async (req, res) => {
  try {
    const teacherId = req.params.id; // Get the ID from the URL params
    const { name, mobileNo } = req.body; // Get updated data from request body

    const updatedTeacher = await teacherModel.update(
      { name, mobileNo },
      { where: { teacherId } }
    );

    if (updatedTeacher[0] === 1) {
      res.status(200).json({
        status: true,
        message: "Teacher Updated",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Teacher Not Found",
      });
    }
  } catch (error) {
    console.error("Error updating teacher:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// Delete teacher by ID
exports.deleteTeacher = asyncHandler(async (req, res) => {
  try {
    const teacherId = req.params.id; // Get the ID from the URL params

    const deletedTeacher = await teacherModel.destroy({
      where: { teacherId },
    });

    if (deletedTeacher) {
      res.status(200).json({
        status: true,
        message: "Teacher Deleted",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Teacher Not Found",
      });
    }
  } catch (error) {
    console.error("Error deleting teacher:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

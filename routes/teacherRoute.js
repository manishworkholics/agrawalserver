// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const TeacherController = require('../controllers/teacherController.js'); // Adjust the path as necessary
const { authMiddleware } = require('../middlewares/authMiddleware.js'); // Adjust the path as necessary

// Get all teachers
router.get('/getAllTeachers', authMiddleware, TeacherController.getAllTeachers);

// Get a single teacher by ID
router.get('/getTeacher/:id', authMiddleware, TeacherController.getSingleTeacher);

// Create a new teacher
router.post('/createTeacher', authMiddleware, TeacherController.createTeacher);

// Update teacher by ID
router.put('/updateTeacher/:id', authMiddleware, TeacherController.updateTeacher);

// Delete teacher by ID
router.delete('/deleteTeacher/:id', authMiddleware, TeacherController.deleteTeacher);

module.exports = router;

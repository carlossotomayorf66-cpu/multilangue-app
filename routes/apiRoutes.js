const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const courseController = require('../controllers/courseController');
const activityController = require('../controllers/activityController');

// === RUTAS ADMIN ===
// Usuarios
// Usuarios
router.get('/users', protect, restrictTo('ADMIN'), adminController.getAllUsers);
router.get('/users/pending', protect, restrictTo('ADMIN'), adminController.getPendingUsers); // Nueva ruta
router.post('/users', protect, restrictTo('ADMIN'), adminController.createUser);
router.put('/users/:id', protect, restrictTo('ADMIN'), adminController.updateUser);
router.put('/users/:id/approve', protect, restrictTo('ADMIN'), adminController.approveUser); // Nueva ruta
router.delete('/users/:id', protect, restrictTo('ADMIN'), adminController.deleteUser);
router.post('/users/:id/reset-password', protect, restrictTo('ADMIN'), adminController.resetPassword);

// Cursos
router.get('/all-courses', protect, restrictTo('ADMIN'), adminController.getAllCourses);
router.post('/courses', protect, restrictTo('ADMIN'), adminController.createCourse);
router.post('/enroll', protect, restrictTo('ADMIN', 'PROFESOR'), courseController.enrollStudent);
router.get('/languages', protect, adminController.getLanguages);

// Config Multer for recordings
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads/recordings');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, 'rec-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Config Multer for materials
const materialsDir = path.join(__dirname, '../public/uploads/materials');
if (!fs.existsSync(materialsDir)) {
    fs.mkdirSync(materialsDir, { recursive: true });
}

const storageMaterials = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, materialsDir)
    },
    filename: function (req, file, cb) {
        // Keep original name but prepend timestamp to avoid collisions
        // Sanitize filename to avoid weird chars
        const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, Date.now() + '-' + safeName);
    }
});
const uploadMaterial = multer({ storage: storageMaterials });


// === RUTAS GENERALES (Profesor + Estudiante) ===
router.get('/my-courses', protect, courseController.getMyCourses);
router.get('/courses/:id', protect, courseController.getCourseDetails);
router.get('/courses/:id/students', protect, courseController.getCourseStudents); // Roster
router.get('/courses/:id/attendance', protect, courseController.getAttendance);
router.get('/courses/:id/attendance-history', protect, courseController.getAttendanceDates); // Historial fechas (Admin)
router.post('/courses/:id/attendance', protect, restrictTo('ADMIN', 'PROFESOR'), courseController.markAttendance);
router.get('/courses/:id/recordings', protect, courseController.getRecordings);
router.post('/courses/:id/recordings', protect, restrictTo('ADMIN', 'PROFESOR'), upload.single('video'), courseController.uploadRecording);

// Materiales
router.get('/courses/:id/materials', protect, courseController.getMaterials);
router.post('/courses/:id/materials', protect, restrictTo('ADMIN', 'PROFESOR'), uploadMaterial.single('file'), courseController.uploadMaterial);

// === ACTIVIDADES ===
// Crear (Prof/Admin)
router.post('/units', protect, restrictTo('ADMIN', 'PROFESOR'), activityController.createUnit);
router.post('/activities', protect, restrictTo('ADMIN', 'PROFESOR'), activityController.createActivity);
// Ver (Todo auth)
router.get('/activities/:id', protect, activityController.getActivity);
// Calificar (Prof/Admin)
router.post('/grade', protect, restrictTo('ADMIN', 'PROFESOR'), activityController.gradeSubmission);
// Entregar (Estudiante)
router.post('/submit', protect, restrictTo('ESTUDIANTE'), activityController.submitActivity);

module.exports = router;

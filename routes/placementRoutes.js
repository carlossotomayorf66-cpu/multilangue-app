const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/tests/:language', protect, placementController.getTestsByLanguage);
router.post('/tests', protect, placementController.createTest);
router.put('/test/:testId', protect, placementController.updateTest);
router.get('/test/:testId', protect, placementController.getTestDetails);
router.delete('/test/:testId', protect, placementController.deleteTest);
router.post('/test/:testId/questions', protect, placementController.addQuestion);
router.delete('/question/:questionId', protect, placementController.deleteQuestion);
router.post('/test/:testId/submit', protect, placementController.submitTest);

module.exports = router;

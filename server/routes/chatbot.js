const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const authenticateToken = require('../middleware/authMiddleware');

router.post(
    '/',
    authenticateToken,
    chatbotController.handleChatMessage
);

module.exports = router;

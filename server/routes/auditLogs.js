const express = require('express');
const router = express.Router();
const auditLogsController = require('../controllers/auditLogsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// Admin-only access to audit logs
router.get(
    '/',
    authenticateToken,
    authorizeRoles('Admin', 'Master Admin'),
    auditLogsController.getLogs
);

module.exports = router;

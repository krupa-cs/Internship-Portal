const express = require('express');
const router = express.Router();
const approvalsController = require('../controllers/approvalsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// Faculty approve offer
router.patch(
    '/offers/:id/faculty',
    authenticateToken,
    authorizeRoles('Faculty', 'Admin', 'Master Admin'),
    approvalsController.facultyApproveOffer
);

// Admin approve offer
router.patch(
    '/offers/:id/admin',
    authenticateToken,
    authorizeRoles('Admin', 'Master Admin'),
    approvalsController.adminApproveOffer
);

// Reject offer (Faculty or Admin)
router.patch(
    '/offers/:id/reject',
    authenticateToken,
    authorizeRoles('Faculty', 'Admin', 'Master Admin'),
    approvalsController.rejectOffer
);

module.exports = router;

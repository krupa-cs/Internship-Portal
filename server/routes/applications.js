const express = require('express');
const router = express.Router();
const controller = require('../controllers/applicationsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// Student route - anyone can apply
router.post('/', authenticateToken, controller.createApplication);

// Recruiter/Faculty/Admin routes
router.get('/offer/:offerId', authenticateToken, authorizeRoles('Recruiter', 'Faculty', 'Admin', 'Master Admin'), controller.getApplicationsByOffer);

// --- Approval Workflow ---

// 1. Faculty Approval
router.patch('/:id/approve/faculty', 
    authenticateToken, 
    authorizeRoles('Faculty', 'Admin', 'Master Admin'), 
    controller.facultyApprove
);

// 2. Admin Final Approval
router.patch('/:id/approve/admin', 
    authenticateToken, 
    authorizeRoles('Admin', 'Master Admin'), 
    controller.adminApprove
);

// Rejection route (Faculty or Admin)
router.patch('/:id/reject', 
    authenticateToken, 
    authorizeRoles('Faculty', 'Admin', 'Master Admin'), 
    controller.rejectApplication
);


module.exports = router;
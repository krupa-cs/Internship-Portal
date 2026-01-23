const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offersController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// PROTECT ALL THESE ROUTES WITH 'authenticateToken'

// GET /api/offers -> Now returns only YOUR offers
router.get('/', authenticateToken, offerController.getMyOffers);

// POST /api/offers -> Creates offer linked to YOU, only for Recruiters
router.post('/', authenticateToken, authorizeRoles('Recruiter'), offerController.createOffer);

// GET /api/offers/:id -> Details of YOUR specific offer
router.get('/:id', authenticateToken, offerController.getOfferById);

module.exports = router;
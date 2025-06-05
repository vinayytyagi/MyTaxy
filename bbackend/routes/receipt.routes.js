const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const receiptController = require('../controllers/receipt.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Generate receipt for a completed ride
router.post(
    '/generate/:rideId',
    authMiddleware.authUser,
    param('rideId').isMongoId().withMessage('Invalid ride ID'),
    receiptController.generateReceipt
);

// Get receipt by ID
router.get(
    '/:receiptId',
    authMiddleware.authUser,
    param('receiptId').isMongoId().withMessage('Invalid receipt ID'),
    receiptController.getReceipt
);

// Get all receipts for the authenticated user
router.get(
    '/user/all',
    authMiddleware.authUser,
    receiptController.getUserReceipts
);

module.exports = router; 
const receiptModel = require('../models/receipt.model');
const rideModel = require('../models/ride.model');
const { validationResult } = require('express-validator');

// Generate receipt for a completed ride
const generateReceipt = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId } = req.params;

        // Find the ride and populate necessary fields with detailed captain information
        const ride = await rideModel.findById(rideId)
            .populate('user', 'fullname email phone')
            .populate({
                path: 'captain',
                select: 'fullname phone vehicle.color vehicle.plate vehicle.vehicleType',
                model: 'Captain'
            });

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Check if ride is completed
        if (ride.status !== 'completed') {
            return res.status(400).json({ message: 'Receipt can only be generated for completed rides' });
        }

        // Check if payment is completed
        if (ride.paymentStatus !== 'completed') {
            return res.status(400).json({ message: 'Payment must be completed to generate receipt' });
        }

        // Check if receipt already exists
        const existingReceipt = await receiptModel.findOne({ ride: rideId })
            .populate('user', 'fullname email phone')
            .populate({
                path: 'captain',
                select: 'fullname phone vehicle.color vehicle.plate vehicle.vehicleType',
                model: 'Captain'
            });

        if (existingReceipt) {
            return res.status(200).json(existingReceipt);
        }

        // Create new receipt with all required fields
        const receiptData = {
            ride: ride._id,
            user: ride.user._id,
            captain: ride.captain._id,
            payment: {
                amount: ride.fare || 0,
                method: ride.paymentMethod || 'cash',
                status: ride.paymentStatus || 'completed',
                transactionId: ride.paymentId,
                paymentDate: ride.endTime || new Date()
            },
            rideDetails: {
                pickup: {
                    address: ride.pickupAddress,
                    coordinates: ride.pickup
                },
                destination: {
                    address: ride.destinationAddress,
                    coordinates: ride.destination
                },
                distance: ride.distance || 0,
                duration: ride.duration || 0,
                vehicleType: ride.vehicleType,
                startTime: ride.startTime,
                endTime: ride.endTime
            }
        };

        // Create and save the receipt
        const receipt = new receiptModel(receiptData);
        await receipt.save();

        // Populate the receipt with user and captain details
        const populatedReceipt = await receiptModel.findById(receipt._id)
            .populate('user', 'fullname email phone')
            .populate({
                path: 'captain',
                select: 'fullname phone vehicle.color vehicle.plate vehicle.vehicleType',
                model: 'Captain'
            });

        if (!populatedReceipt) {
            throw new Error('Failed to populate receipt after creation');
        }

        res.status(201).json(populatedReceipt);
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ 
            message: 'Error generating receipt', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get receipt by ID
const getReceipt = async (req, res) => {
    try {
        const { receiptId } = req.params;

        const receipt = await receiptModel.findById(receiptId)
            .populate('user', 'fullname email phone')
            .populate('captain', 'fullname phone vehicle')
            .populate('ride');

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Verify that the requesting user owns this receipt
        if (receipt.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this receipt' });
        }

        res.status(200).json(receipt);
    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({ message: 'Error fetching receipt' });
    }
};

// Get all receipts for a user
const getUserReceipts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const receipts = await receiptModel.find({ user: req.user._id })
            .populate('ride', 'status paymentStatus paymentMethod fare')
            .populate('captain', 'fullname vehicle')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await receiptModel.countDocuments({ user: req.user._id });

        res.status(200).json({
            receipts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalReceipts: total
        });
    } catch (error) {
        console.error('Error fetching user receipts:', error);
        res.status(500).json({ message: 'Error fetching receipts' });
    }
};

module.exports = {
    generateReceipt,
    getReceipt,
    getUserReceipts
}; 
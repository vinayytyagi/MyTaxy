const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    // Reference to the ride
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    // Reference to the user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reference to the captain
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Captain',
        required: true
    },
    // Receipt number (auto-generated)
    receiptNumber: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `MT-${year}${month}${day}-${random}`;
        }
    },
    // Payment details
    payment: {
        amount: {
            type: Number,
            required: true
        },
        method: {
            type: String,
            enum: ['cash', 'card', 'wallet'],
            required: true
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            required: true
        },
        transactionId: String,
        paymentDate: {
            type: Date,
            required: true
        }
    },
    // Ride details
    rideDetails: {
        pickup: {
            address: String,
            coordinates: String
        },
        destination: {
            address: String,
            coordinates: String
        },
        distance: Number, // in kilometers
        duration: Number, // in minutes
        vehicleType: String,
        startTime: Date,
        endTime: Date
    },
    // Company details
    companyDetails: {
        name: {
            type: String,
            default: 'MyTaxy'
        },
        address: {
            type: String,
            default: '123 Taxi Street, City, Country'
        },
        phone: {
            type: String,
            default: '+91 1234567890'
        },
        email: {
            type: String,
            default: 'support@mytaxy.com'
        },
        gstin: {
            type: String,
            default: 'GSTIN123456789'
        }
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ ride: 1 });
receiptSchema.index({ user: 1 });
receiptSchema.index({ createdAt: 1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt; 
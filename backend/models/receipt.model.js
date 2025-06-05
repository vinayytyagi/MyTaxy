payment: {
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['cash', 'card', 'wallet', 'upi'],
        required: true,
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        required: true,
        default: 'completed'
    },
    transactionId: {
        type: String,
        required: function() {
            return this.payment.method !== 'cash'; // Only required for non-cash payments
        }
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    }
}, 
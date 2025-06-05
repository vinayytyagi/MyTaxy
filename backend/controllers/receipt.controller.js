// Create new receipt with all required fields
const receiptData = {
    ride: ride._id,
    user: ride.user._id,
    captain: ride.captain._id,
    payment: {
        amount: ride.fare || 0,
        method: ride.paymentMethod === 'razorpay' ? 'card' : 
               ride.paymentMethod === 'cash' ? 'cash' :
               ride.paymentMethod === 'wallet' ? 'wallet' :
               ride.paymentMethod === 'upi' ? 'upi' : 'cash',
        status: ride.paymentStatus || 'completed',
        transactionId: ride.paymentMethod === 'cash' ? undefined : ride.paymentId,
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

// Check if ride is completed
if (ride.status !== 'completed') {
    return res.status(400).json({ message: 'Receipt can only be generated for completed rides' });
}

// Check if payment is completed or if it's a cash payment
if (ride.paymentStatus !== 'completed' && ride.paymentMethod !== 'cash') {
    return res.status(400).json({ message: 'Payment must be completed to generate receipt' });
}

// Check if receipt already exists 
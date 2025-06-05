// Verify payment
router.post('/verify', authUser, async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            rideId
        } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Get ride details with captain
            const ride = await Ride.findById(rideId).populate('captain');
            if (!ride) {
                return res.status(404).json({ message: 'Ride not found' });
            }

            // Update ride status with payment method as 'card' for online payments
            await Ride.findByIdAndUpdate(rideId, {
                paymentStatus: 'completed',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                paymentMethod: 'card'  // Set payment method as 'card' for online payments
            });

            // Notify captain about payment completion
            if (ride.captain && ride.captain.socketId) {
                sendMessageToSocketId(ride.captain.socketId, {
                    event: 'payment_completed',
                    data: {
                        rideId: ride._id,
                        amount: ride.fare,
                        paymentMethod: 'card'  // Update this to match the ride's payment method
                    }
                });
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Error verifying payment' });
    }
}); 
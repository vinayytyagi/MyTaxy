const rideService=require('../services/ride.service');
const {validationResult} =require('express-validator');
const mapService=require('../services/maps.service');
const rideModel=require('../models/ride.model');
const { sendMessageToSocketId } = require('../socket');
const captainModel = require('../models/captain.model');


const createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType, scheduledTime } = req.body;

    try {
        // Get coordinates for pickup and destination
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        const destinationCoordinates = await mapService.getAddressCoordinate(destination);

        if (!pickupCoordinates || !destinationCoordinates) {
            return res.status(400).json({ message: 'Invalid pickup or destination address' });
        }

        const rideData = {
            user: req.user._id,
            pickup: `${pickupCoordinates.ltd},${pickupCoordinates.lng}`,
            destination: `${destinationCoordinates.ltd},${destinationCoordinates.lng}`,
            pickupAddress: pickup,
            destinationAddress: destination,
            vehicleType,
            bookingTime: new Date(),
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null
        };

        console.log('Creating ride with data:', rideData); // Debug log

        const ride = await rideService.createRide(rideData);
        
        // Send response before notifying captains
        res.status(201).json(ride);

        // Find and notify nearby captains with matching vehicle type
        const captainsInRadius = await mapService.getCaptainsInTheRadius(
            pickupCoordinates.ltd, 
            pickupCoordinates.lng, 
            100, // radius in km
            vehicleType // pass vehicle type to filter captains
        );
        console.log(`Found ${captainsInRadius.length} ${vehicleType} captains in radius`);

        if (ride) {
            const rideWithUser = await rideModel.findOne({ _id: ride._id })
                .populate('user')
                .select('+distance +duration'); // Explicitly select distance and duration
            
            console.log('Sending ride data to captains:', {
                id: rideWithUser._id,
                distance: rideWithUser.distance,
                duration: rideWithUser.duration
            });
            
            captainsInRadius.forEach(captain => {
                if (captain.socketId) {
                    sendMessageToSocketId(captain.socketId, {
                        event: 'new-ride',
                        data: rideWithUser
                    });
                }
            });
        }

    } catch (err) {
        console.error('Error creating ride:', err);
        return res.status(500).json({ message: err.message });
    }
};

const getFare = async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const{ pickup,destination}=req.query;
    try{
        const fare=await rideService.getFare(pickup,destination);
        return res.status(200).json(fare);

    }catch(err){
        return res.status(500).json({message:err.message});
    }
}

const confirmRide = async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {rideId}=req.body;

    try{
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });
        
        // Make sure we have the OTP
        if (!ride.otp) {
            console.error('OTP not found for ride:', ride._id);
        }
        
        // Send OTP to user
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: {
                ...ride.toObject(),
                otp: ride.otp // Explicitly include OTP
            }
        });
        
        // Log for debugging
        console.log('Sending ride confirmation with OTP:', ride.otp);
        
        return res.status(200).json(ride);
    }catch(err){
        console.error('Error confirming ride:', err);
        return res.status(500).json({message:err.message});
    }
}

const startRide = async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;
    try{
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    }catch(err){
        return res.status(500).json({message:err.message});
    }
}

const endRide = async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

const checkAndCancelOldPendingRides = async () => {
    try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000); // 1 minute ago
        
        const oldPendingRides = await rideModel.find({
            status: 'pending',
            bookingTime: { $lt: oneMinuteAgo }
        });

        for (const ride of oldPendingRides) {
            ride.status = 'cancelled';
            await ride.save();
            
            // Notify user if they're connected
            if (ride.user.socketId) {
                sendMessageToSocketId(ride.user.socketId, {
                    event: 'ride-cancelled',
                    data: { rideId: ride._id, reason: 'No captain found within time limit' }
                });
            }
        }

        return oldPendingRides.length;
    } catch (error) {
        console.error('Error checking old pending rides:', error);
        return 0;
    }
};

/**
 * Get active ride for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with active ride or error
 */
const getActiveRideForUser = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // First check and cancel any old pending rides
        await checkAndCancelOldPendingRides();
        
        const activeRide = await rideModel.findOne({
            user: userId,
            status: { $in: ['accepted', 'ongoing'] }
        }).populate('captain');

        if (!activeRide) {
            return res.status(404).json({ message: 'No active ride found' });
        }

        res.status(200).json({ ride: activeRide });
    } catch (error) {
        console.error('Error getting active ride:', error);
        res.status(500).json({ message: 'Error getting active ride' });
    }
};

const getRideHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all rides (completed, cancelled, ongoing, pending) sorted by booking time (newest first)
        const rides = await rideModel.find({
            user: userId,
            status: { $in: ['completed', 'cancelled', 'ongoing', 'pending'] }
        })
        .sort({ bookingTime: -1 })
        .populate({
            path: 'captain',
            select: 'fullname phone vehicle.color vehicle.plate vehicle.type'
        })
        .limit(20); // Limit to 20 most recent rides

        // Map through rides to ensure proper status handling
        const mappedRides = rides.map(ride => {
            const rideObj = ride.toObject();
            // If ride was cancelled by captain or user, ensure status is 'cancelled'
            if (rideObj.status === 'pending' && rideObj.captain) {
                rideObj.status = 'cancelled';
            }
            return rideObj;
        });
        
        res.status(200).json({ rides: mappedRides });
    } catch (error) {
        console.error('Error getting ride history:', error);
        res.status(500).json({ message: 'Error getting ride history' });
    }
};

const getCaptainRideHistory = async (req, res) => {
    try {
        const captainId = req.captain._id;
        
        // Get all rides for the captain sorted by booking time (newest first)
        const rides = await rideModel.find({
            captain: captainId,
            status: { $in: ['completed', 'cancelled', 'ongoing', 'pending'] }
        })
        .sort({ bookingTime: -1 })
        .populate({
            path: 'user',
            select: 'fullname phone'
        })
        .limit(20); // Limit to 20 most recent rides

        res.status(200).json({ rides });
    } catch (error) {
        console.error('Error getting captain ride history:', error);
        res.status(500).json({ message: 'Error getting ride history' });
    }
};

const getCaptainDailyEarnings = async (req, res) => {
    try {
        const captainId = req.captain._id;
        
        // Get today's start and end time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all completed rides for today
        const rides = await rideModel.find({
            captain: captainId,
            status: 'completed',
            updatedAt: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Calculate total earnings
        const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare, 0);

        console.log('Daily earnings query:', {
            captainId,
            today,
            tomorrow,
            rideCount: rides.length,
            totalEarnings
        });

        res.status(200).json({ 
            totalEarnings,
            rideCount: rides.length
        });
    } catch (error) {
        console.error('Error getting captain daily earnings:', error);
        res.status(500).json({ message: 'Error getting daily earnings' });
    }
};

const updateRideStatus = async (req, res) => {
    try {
        const { rideId, status } = req.body;
        
        const ride = await rideModel.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Only allow status updates for rides belonging to the user
        if (ride.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this ride' });
        }

        ride.status = status;
        await ride.save();

        res.json({ message: 'Ride status updated successfully', ride });
    } catch (error) {
        console.error('Error updating ride status:', error);
        res.status(500).json({ message: 'Error updating ride status' });
    }
};

module.exports = {
    createRide,
    getFare,
    confirmRide,
    startRide,
    endRide,
    getActiveRideForUser,
    getRideHistory,
    getCaptainRideHistory,
    getCaptainDailyEarnings,
    updateRideStatus,
    checkAndCancelOldPendingRides
};

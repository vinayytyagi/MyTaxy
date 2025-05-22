const rideModel=require('../models/ride.model');
const mapService=require('../services/maps.service');
const crypto=require('crypto');


module.exports.getFare=async(pickup, destination)=>{

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseFare = {
        car: 50,
        auto: 30,
        motorcycle: 20,
        moto: 20  // Add moto as alias for motorcycle
    };

    const perKmRate = {
        car: 12,
        auto: 10,
        motorcycle: 8,
        moto: 8  // Add moto as alias for motorcycle
    };

    const perMinuteRate = {
        car: 2,
        auto: 1.8,
        motorcycle: 1.5,
        moto: 1.5  // Add moto as alias for motorcycle
    };

    const calculateFare = (distanceTime, vehicleType) => {
        // Map 'moto' to 'motorcycle' for calculations
        const type = vehicleType === 'moto' ? 'motorcycle' : vehicleType;
        
        if (type === 'car') {
            return Math.round(baseFare.car + ((distanceTime.distance.value / 1000) * perKmRate.car) + ((distanceTime.duration.value / 60) * perMinuteRate.car));
        } else if (type === 'auto') {
            return Math.round(baseFare.auto + ((distanceTime.distance.value / 1000) * perKmRate.auto) + ((distanceTime.duration.value / 60) * perMinuteRate.auto));
        } else if (type === 'motorcycle') {
            return Math.round(baseFare.motorcycle + ((distanceTime.distance.value / 1000) * perKmRate.motorcycle) + ((distanceTime.duration.value / 60) * perMinuteRate.motorcycle));
        }
        return 0;
    };

    const fare = {
        auto: calculateFare(distanceTime, 'auto'),
        car: calculateFare(distanceTime, 'car'),
        motorcycle: calculateFare(distanceTime, 'motorcycle'),
        moto: calculateFare(distanceTime, 'moto')  // Add moto fare calculation
    };

    return fare;
}
function getOtp(num){
    function generateOtp(num){
        const otp=crypto.randomInt(Math.pow(10,num-1),Math.pow(10,num)).toString();
        return otp;
    }
    return generateOtp(num);
}

module.exports.createRide = async ({ user, pickup, destination, vehicleType, pickupAddress, destinationAddress, bookingTime, scheduledTime }) => {
    if (!user || !pickup || !destination || !vehicleType || !pickupAddress || !destinationAddress) {
        throw new Error('All fields are required');
    }

    try {
        const fare = await this.getFare(pickupAddress, destinationAddress);
        const distanceTime = await mapService.getDistanceTime(pickupAddress, destinationAddress);
        
        const ride = await rideModel.create({
            user,
            pickup,
            destination,
            pickupAddress,
            destinationAddress,
            vehicleType,
            otp: getOtp(6),
            fare: fare[vehicleType],
            distance: distanceTime.distance.value / 1000, // Convert meters to kilometers
            duration: distanceTime.duration.value / 60, // Convert seconds to minutes
            bookingTime: bookingTime || new Date(),
            scheduledTime
        });
        return ride;
    } catch (error) {
        console.error('Error in createRide service:', error);
        throw error;
    }
};

module.exports.confirmRide=async({rideId,captain})=>{
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;
}

module.exports.startRide=async({rideId,otp,captain})=>{
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }
    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}
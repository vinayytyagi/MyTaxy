const captainModel=require('../models/captain.model');

module.exports.createCaptain=async({firstname,lastname,email,password,phone,color,plate,capacity,vehicleType})=>{

    if (!firstname || !email || !password || !phone || !color || !plate || !capacity || !vehicleType) {
        throw new Error('All fields are required');
    }
    const captain = captainModel.create({
        fullname: {
            firstname,
            lastname
        },
        email,
        phone,
        password,
        vehicle: {
            color,
            plate,
            capacity,
            vehicleType
        },
        location: {
            type: "Point",
            coordinates: [0, 0] // Default coordinates, will be updated when captain starts driving
        }
    })

    return captain;
}

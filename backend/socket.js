const socketIo= require('socket.io');
const userModel=require('./models/user.model');
const captainModel=require('./models/captain.model');
const rideModel = require('./models/ride.model');

let io;

function initializeSocket(server){
    const corsOptions = {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://mytaxy.vercel.app', 'http://localhost:5173'],
        methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST'],
        credentials: process.env.CORS_CREDENTIALS === 'true',
        allowedHeaders: process.env.CORS_ALLOWED_HEADERS ? process.env.CORS_ALLOWED_HEADERS.split(',') : ['Content-Type', 'Authorization']
    };

    io=socketIo(server,{
        cors: corsOptions
    });
    io.on("connection",(socket)=>{
        console.log(`Client connected:${socket.id}`);


       socket.on('join',async(data)=>{
        const{userId,userType}=data;
        console.log(`User ${userId} joined as ${userType}`);
        if(userType==="user"){
            await userModel.findByIdAndUpdate(userId,{socketId:socket.id});
        }else if(userType==="captain"){
            await captainModel.findByIdAndUpdate(userId,{
                socketId: socket.id,
                status: 'active'
            });

            // Send all available rides to the new captain
            try {
                const availableRides = await rideModel.find({
                    status: { $in: ['pending', 'accepted'] },
                    captain: { $exists: false }
                })
                .select('+distance +duration') // Explicitly select distance and duration
                .sort({ createdAt: -1 });

                if (availableRides.length > 0) {
                    console.log(`Sending ${availableRides.length} available rides to new captain ${userId}`);
                    console.log('Sample ride data:', {
                        id: availableRides[0]._id,
                        distance: availableRides[0].distance,
                        duration: availableRides[0].duration
                    });
                    socket.emit('available-rides', availableRides);
                }
            } catch (error) {
                console.error('Error fetching available rides for new captain:', error);
            }
        }
       });

       socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    type: 'Point',
                    coordinates: [location.lng, location.ltd]
                },
                status: 'active'
            });
        });

        // Handle driver location update for live tracking
        socket.on('driver-location-update', (data) => {
            const { rideId, location } = data;
            
            if (!rideId || !location || !location.latitude || !location.longitude) {
                return socket.emit('error', { message: 'Invalid driver location data' });
            }
            
            // Broadcast the driver location to all clients tracking this ride
            io.emit(`driverLocation:${rideId}`, location);
            console.log(`Driver location updated for ride ${rideId}:`, location);
        });

        // Handle clients joining a specific ride room
        socket.on('join-ride', (data) => {
            const { rideId } = data;
            
            if (!rideId) {
                return socket.emit('error', { message: 'Invalid ride ID' });
            }
            
            socket.join(`ride:${rideId}`);
            console.log(`Client ${socket.id} joined ride room: ride:${rideId}`);
        });

        // Handle ride requests with vehicle type matching
        socket.on('request-ride', async (data) => {
            const { rideId, pickup, destination, vehicleType } = data;
            
            if (!rideId || !pickup || !destination || !vehicleType) {
                return socket.emit('error', { message: 'Invalid ride request data' });
            }

            try {
                // Map 'moto' to 'motorcycle' for database query
                const dbVehicleType = vehicleType === 'moto' ? 'motorcycle' : vehicleType;

                // Find nearby captains with matching vehicle type
                const nearbyCaptains = await captainModel.find({
                    'location': {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: [pickup.lng, pickup.lat]
                            },
                            $maxDistance: 5000 // 5km radius
                        }
                    },
                    'vehicle.vehicleType': dbVehicleType,
                    isAvailable: true
                }).limit(5);

                if (nearbyCaptains.length === 0) {
                    return socket.emit('no-captains-available', { 
                        message: `No ${vehicleType} captains available nearby` 
                    });
                }

                // Send ride request to all nearby captains
                nearbyCaptains.forEach(captain => {
                    if (captain.socketId) {
                        io.to(captain.socketId).emit('new-ride-request', {
                            rideId,
                            pickup,
                            destination,
                            vehicleType
                        });
                    }
                });

                console.log(`Ride request sent to ${nearbyCaptains.length} ${vehicleType} captains for ride ${rideId}`);
            } catch (error) {
                console.error('Error finding nearby captains:', error);
                socket.emit('error', { message: 'Error finding nearby captains' });
            }
        });

        // Add new handler for ride acceptance
        socket.on('ride-accepted', async (data) => {
            const { rideId } = data;
            
            if (!rideId) {
                return socket.emit('error', { message: 'Invalid ride ID' });
            }

            try {
                // Update ride status in database
                await rideModel.findByIdAndUpdate(rideId, {
                    status: 'accepted'
                });

                // Broadcast to ALL captains that this ride is no longer available
                io.emit('ride-no-longer-available', { 
                    rideId,
                    message: 'Ride has been accepted by another captain'
                });
                
                console.log(`Ride ${rideId} accepted, notifying all captains`);
            } catch (error) {
                console.error('Error handling ride acceptance:', error);
            }
        });

        socket.on('payment-successful', async (data) => {
            try {
                console.log('Received payment-successful event:', data);
                const { rideId, captainId } = data;
                
                // Get captain's socket ID
                const captain = await captainModel.findById(captainId);
                console.log('Found captain:', captain?.socketId);
                
                if (captain && captain.socketId) {
                    // Update ride status to completed
                    await rideModel.findByIdAndUpdate(rideId, {
                        status: 'completed'
                    });
                    
                    // Emit to ride-specific room
                    io.to(`ride:${rideId}`).emit('payment-successful', {
                        rideId,
                        captainId,
                        message: 'Payment successful! Ride completed.'
                    });
                    
                    console.log('Payment success notification sent to ride room:', rideId);
                } else {
                    console.log('Captain not found or no socket ID');
                }
            } catch (error) {
                console.error('Error handling payment success:', error);
            }
        });

        socket.on("disconnect", async () => {
            console.log(`Client disconnected:${socket.id}`);
            // Set captain status to inactive on disconnect
            await captainModel.findOneAndUpdate(
                { socketId: socket.id },
                { status: 'inactive' }
            );
        });
    });
}

function sendMessageToSocketId(socketId,messageObject){
    console.log(`Sending message to ${socketId}`,messageObject);
    if(io){
        try {
            io.to(socketId).emit(messageObject.event,messageObject.data);
            console.log(`Message sent successfully to ${socketId}`);
        } catch (error) {
            console.error(`Error sending message to ${socketId}:`, error);
        }
    }else{
        console.error("Socket.io not initialized");
    }
}

// Function to broadcast driver location updates
function broadcastDriverLocation(rideId, location) {
    if (io) {
        io.emit(`driverLocation:${rideId}`, location);
    } else {
        console.error("Socket.io not initialized");
    }
}

module.exports={
    initializeSocket,
    sendMessageToSocketId,
    broadcastDriverLocation
};
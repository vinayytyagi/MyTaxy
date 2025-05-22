const mongoose=require('mongoose');

const rideSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    captain:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'captain',
    },
    pickup:{
        type:String,
        required:true,
    },
    destination:{
        type:String,
        required:true,
    },
    pickupAddress: {
        type: String,
        required: true
    },
    destinationAddress: {
        type: String,
        required: true
    },
    fare:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        enum:['pending','accepted','ongoing','completed','cancelled'],
        default:'pending'
    },
    duration:{
        type:Number,
    },
    distance:{
        type:Number,
    },
    bookingTime: {
        type: Date,
        default: Date.now
    },
    scheduledTime: {
        type: Date
    },
    // now this made for payment 
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentId: {
        type: String
    },
    orderId: {
        type: String
    },
    signature:{
        type:String,
    },
    otp:{
        type:String,
        select:false,
        required:true
    }
}, {
    timestamps: true
});

module.exports=mongoose.model('ride',rideSchema);

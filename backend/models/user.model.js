const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');

const userSchema=new mongoose.Schema({
    fullname:{
        firstname:{
            type:String,
            required:true,
            minlength:[3,'First name must have length 3 characters'],
            trim:true
        },
        lastname:{
            type:String,
            minlength:[3,'Last name must have length 3 characters'],
            trim:true
        },
    },
    email:{
        type:String,
        required:true,
        unique:true,
        minlength:[5,'Email must have atleast 5 characters'],
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        select:false,
    },
    phone: {
        type: String,
        trim: true
    },
    profilePhoto: {
        type: String,
        default: null
    },
    socketId:{
        type:String,
        default:null
    }
},{
    timestamps:true
});

// now we define some method on user model 

userSchema.methods.generateAuthToken=function(){
    const token=jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:'24h'})
    return token;
}
userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.statics.hashPassword=async function(password){
    return await bcrypt.hash(password,10);
}

const userModel=mongoose.model('user',userSchema);//this create a users collections 

module.exports=userModel;
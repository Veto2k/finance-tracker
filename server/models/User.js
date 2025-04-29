const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()


const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
    },
    type : {
        type: String,
        enum: ["google","password","both"],
        required: true,
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
    },
    profileImage : {
        type: String,
        default: null
    },
    },{
        timestamps:true
    })

userSchema.pre("save", async function (next) {
    try {
      if (!this.isModified("password")) return next(); 
      const salt = await bcrypt.genSalt(process.env.SALT);
      this.password = await bcrypt.hash(this.password, salt);
      next(); 
    } catch (error) {
      next(error); 
    }
  });
  
// userSchema.methods.comparePassword = async function (password) {
//     return await bcrypt.compare(password, this.password);
//   };
  

  const User = mongoose.model('User', userSchema);

  module.exports = User;
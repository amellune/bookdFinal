 const mongoose = require('mongoose')
 const bcrypt = require('bcrypt')


const userSchema = mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required: true  //required to be filled
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    }    

})

//helpful functions

userSchema.pre("save", function(next) {
    if(!this.isModified("password")) {
        return next();  //check if the user creating password
    }
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});


//compare pasword function

userSchema.methods.comparePassword = function(plaintext, callback) {
    return callback(null, bcrypt.compareSync(plaintext, this.password));
};

// userModel is a Model, a subclass of 'mongoose.Model

const userModel = mongoose.model('user',userSchema,'bookd')

module.exports = userModel
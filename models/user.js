const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
   
    email: {
        type: String,
        required: true,
        unique: true
    },
    bio: String,
    location: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date

    
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

module.exports = User;

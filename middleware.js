const ExpressError=require("./utils/ExpressError.js");
const User=require("./models/user.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in first!");
    return res.redirect("/signin");
  } 
    next();
    
  
};
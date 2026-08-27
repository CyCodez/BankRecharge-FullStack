const jwt=require("jsonwebtoken");
function createToken(user){return jwt.sign({userId:user._id.toString(),email:user.email,name:user.name},process.env.JWT_SECRET,{expiresIn:"2h"});}
module.exports={createToken};

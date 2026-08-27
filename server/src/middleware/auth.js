const {ObjectId}=require("mongodb"); const jwt=require("jsonwebtoken"); const {getDb}=require("../config/db");
async function requireAuth(req,res,next){
 try{
  const h=req.headers.authorization; if(!h?.startsWith("Bearer ")) return res.status(401).json({success:false,message:"Authentication required."});
  const token=h.slice(7), decoded=jwt.verify(token,process.env.JWT_SECRET);
  if(!ObjectId.isValid(decoded.userId)) throw new Error();
  const user=await getDb().collection("users").findOne({_id:new ObjectId(decoded.userId)},{projection:{passwordHash:0}});
  if(!user) throw new Error(); req.user=user; next();
 }catch(e){res.status(401).json({success:false,message:"Session expired. Please sign in again."});}
}
module.exports={requireAuth};

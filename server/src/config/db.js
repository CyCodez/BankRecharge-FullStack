const { MongoClient } = require("mongodb");
let client; let db;
async function connectDatabase(){
  if(db) return db;
  client=new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db=client.db(process.env.MONGODB_DB_NAME||"bankrecharge");
  await Promise.all([
    db.collection("users").createIndex({email:1},{unique:true}),
    db.collection("wallets").createIndex({userId:1},{unique:true}),
    db.collection("transactions").createIndex({userId:1,createdAt:-1}),
    db.collection("recharges").createIndex({userId:1,createdAt:-1})
  ]);
  console.log("MongoDB connected"); return db;
}
function getDb(){if(!db) throw new Error("Database not connected"); return db;}
module.exports={connectDatabase,getDb};

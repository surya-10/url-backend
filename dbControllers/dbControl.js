import {client} from "../db.js";
import { ObjectId } from "mongodb";

export function addUser(data){
    return client.db("url-final").collection("users").insertOne(data);
}
export function checkUser(email){
    return client.db("url-final").collection("users").findOne({email:email});
}


export function findUserById(id){
    return client.db("url-final").collection("users").findOne({_id:new ObjectId(id)});
}
export async function activateUser(id){
    let a = await client.db("url-final").collection("users").updateOne({_id: new ObjectId(id)}, {$set:{status:true}});
    return a.acknowledged;
}
export function updateNewPassword(id, password){
    return client.db("url-final").collection("users").updateOne({_id:new ObjectId(id)}, {$set:{password:password}})
}

export async function updatetokenToDb(token, email){
    let addToken = await client.db("url-final").collection("users").updateOne({email:email}, {$set:{tempToken:token}});
    return addToken.acknowledged;
}
export async function checkToken(id, token){
    let verifyToken = await client.db("url-final").collection("users").findOne({_id:new ObjectId(id)});
    if(verifyToken.tempToken===token){
        let removeToken = await client.db("url-final").collection("users").updateOne({_id:new ObjectId(id)}, {$unset:{"tempToken":1}});
        return removeToken.acknowledged;
    }
}
import { client } from "../db.js";
export function checkingUrl(url){
    return client.db("url-final").collection("URL").findOne({longUrl:url});
}

export function updateNewUrl(id, url){
    let currentTime = new Date();
    return client.db("url-final").collection("URL").insertOne({longUrl:url, shortID:id, createdAt:{toDate:currentTime}});
}

export async function findbyShortId(shortId){
    let a = await client.db("url-final").collection("URL").findOne({shortID:shortId});
    return a;
}

export async function findAllUrls(){
    let a = await client.db("url-final").collection("URL").find().toArray();
    return a;
}

export async function findDayCount(){
    let links = await client.db("url-final").collection("URL").aggregate([{$project:{day:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt.toDate"}},},},{$group:{_id:"$day",count:{$sum:1},},},{$sort:{_id:1},},]).toArray();
    return links;
}


export async function findMonthCount(){
  let monthCounts = await client.db("url-final").collection("URL").aggregate([{$project:{month:{$dateToString:{format:"%Y-%m",date:"$createdAt.toDate"}},},},{$group:{_id:"$month",count:{$sum:1},},},{$sort:{_id:1},},]).toArray();
  return monthCounts;
}


  
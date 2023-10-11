import express from "express";
import shortid from "shortid";
import { client } from "../db.js";
import { checkingUrl, findAllUrls, findDayCount, findMonthCount, findbyShortId, updateNewUrl } from "../dbControllers/urlControls.js";
let urlRouter = express.Router();



urlRouter.post("/", async(req, res)=>{
    try {
        let {url} = req.body;
        let checkgivenUrl = await checkingUrl(url);
        if(checkgivenUrl!==null){
            return res.status(200).json({id:checkgivenUrl.shortID})
        }
        else{
            let srtID = shortid.generate();
            let addUrl = await updateNewUrl(srtID, url);
            let findAfterUpdate = await checkingUrl(url);
            return res.status(200).json({id:findAfterUpdate.shortID});
        }
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

urlRouter.get("/:shortId", async(req, res)=>{
    try {
        const {shortId} = req.params;
        let entry = await findbyShortId(shortId);
        return res.status(200).json({url:entry.longUrl, status:200});
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
   
});

urlRouter.get("/links/all", async(req, res)=>{
    try {
        let allUrl = await findAllUrls();
        return res.json({allLinks:allUrl})
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

urlRouter.get("/count/:value", async(req, res)=>{
    try {
        let {value} = req.params;
        if(value==="day"){
            let getEveryCount = await findDayCount();
            return res.status(200).json({status:200, urls:getEveryCount});
        }
        if(value==="month"){
            let getEveryMonth = await findMonthCount();
            return res.status(200).json({status:200, urls:getEveryMonth});
        }
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})
export let url = urlRouter;
import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import { activateUser, addUser, checkToken, checkUser, findUserById, updateNewPassword, updatetokenToDb } from "../dbControllers/dbControl.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

let adminEmail = process.env.email;
let adminPass = process.env.pass;

let router = express.Router();

router.get("/", async (req, res) => {
    res.status(200).json({ message: "working good" });
})

router.post("/signup", async (req, res) => {
    try {
        let userData = req.body;
        if (!userData) {
            return res.status(400).json({ status: 400, msg: "invalid", resp: false })
        }
        let isExist = await checkUser(userData.email);
        if (isExist) {
            return res.status(400).json({ status: 400, msg: "exist", resp: false })
        }
        let saltVal = await bcrypt.genSalt(10);
        let hashedPass = await bcrypt.hash(userData.password, saltVal);
        userData.password = hashedPass;
        userData.status = false;


        let result = await addUser(userData);
        let getUserId = await checkUser(userData.email);

        let token = jwt.sign({ id: getUserId._id }, process.env.key, { expiresIn: "1d" });
        let tranport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: adminEmail,
                pass: adminPass
            }
        });

        let mailoption = {
            from: adminEmail,
            to: userData.email,
            subject: "Account activation link",
            html: `<div><p><b>Hi</b> <b>${userData.firstname},</b></p>
            <h3>We have sent a account activation link. please click on below link to activate your account. This link will be expired after 24 hours.</h3>
            <a href=https://url-shortner-auth.netlify.app/activate/${getUserId._id}/${token} target=_blank>click me</a></div>`
        }
        tranport.sendMail(mailoption, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                return res.status(201).json({ status: 201, msg: "your signup was success. we have sent accoutn activation link to your email", resp: true })
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

router.get("/activate/:id/:token", async (req, res) => {
    try {
        let { token, id } = req.params;
        let finalResult = false;
        let status = "";
        let verifyToken = jwt.verify(token, process.env.key, (err, decoded) => {
            if (err) {
                finalResult = false;
                status = "expired"
            }
            else {
                finalResult = true;
                status = "verified"
            }
        });
        if (status === false) {
            return res.status(400).json({ status: 400, resp: false, msg: "expired" })
        }
        if (finalResult) {
            let activate = await activateUser(id);
            if (activate) {
                return res.status(200).json({ status: 200, resp: true, msg: "verified" });
            }
            else {
                return res.status(400).json({ status: 400, resp: false, msg: "expired" })
            }
        }

    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

router.get("/resend/:id", async (req, res) => {
    try {
        let { id } = req.params;
        let user = await findUserById(id);
        let token = jwt.sign({ id: user._id }, process.env.key, { expiresIn: "1d" });
        let tranport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: adminEmail,
                pass: adminPass
            }
        });

        let mailoption = {
            from: adminEmail,
            to: `${user.email} sp659151@gmail.com`,
            subject: "Account activation link",
            html: `<div><p><b>Hi</b> <b>${user.firstname},</b></p>
            <h3>We have sent a account activation link. please click on below link to activate your account. This link will be expired after 24 hours.</h3>
            <a href=https://url-shortner-auth.netlify.app/activate/${user._id}/${token} target=_blank>click me</a></div>`
        }
        tranport.sendMail(mailoption, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("mail sent")
                return res.status(201).json({ status: 201, msg: "your signup was success. we have sent accoutn activation link to your email", resp: true })
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

//login 

router.post("/login", async(req, res)=>{
    try {
        let userData = req.body;

        if (!userData) {
            return res.status(400).json({ status: 400, msg: "invalid", resp: false })
        }
        let isExist = await checkUser(userData.email);
        if(!isExist){
            return res.status(400).json({ status: 400, msg: "not exist", resp: false })
        }
        if(isExist.status===false){
            return res.status(400).json({status:400, msg:"not active", resp:false, id:isExist._id})
        }
        let passwordCheck = await bcrypt.compare(userData.password, isExist.password);
        if(!passwordCheck){
            return res.status(400).json({ status: 400, msg: "wrong", resp: false })
        }
        return res.status(200).json({status: 200, msg: "success", resp:true, name:isExist.firstname})

    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

//forgot password

router.post("/forgot", async(req, res)=>{
    try {
        let {email} = req.body;
        let isExist = await checkUser(email);
        if(!isExist){
            return res.status(400).json({ status: 400, msg: "not exist", resp: false })
        }
        let token = jwt.sign({ id: isExist._id }, process.env.key, { expiresIn: "300s" });
        let updateToken = await updatetokenToDb(token, isExist.email);
        if(updateToken){
        let tranport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: adminEmail,
                pass: adminPass
            }
        });
        let mailoption = {
            from: adminEmail,
            to: `${isExist.email} sp659151@gmail.com`,
            subject: "RESET PASSWORD",
            html: `<div><p><b>Hi</b> <b>${isExist.firstname},</b></p>
            <h3>We have sent a account activation link. please click on below link to activate your account. This link will be expired after 5 minutes.</h3>
            <a href=https://url-shortner-auth.netlify.app/password-reset/${isExist._id}/${token} target=_blank>click me</a></div>`
        }
        tranport.sendMail(mailoption, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                return res.status(201).json({ status: 201, msg: "your signup was success. we have sent accoutn activation link to your email", resp: true })
            }
        });
    }



    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }
})

router.get("/reset/:id/:token", async(req, res)=>{
    let {id, token} = req.params;
    let finalResult = false;
    let checkTokenAndRemove = await checkToken(id, token);
    if(checkTokenAndRemove){
    let status = "";
    let verifyToken = jwt.verify(token, process.env.key, (err, decode)=>{
        if(err){
            finalResult = false;
            status="expired";
            return res.status(400).json({status:400, msg:"expired", resp:false})
        }
        else{
            finalResult=true;
            status="verified";
            return res.status(200).json({status:200, msg:"verified", resp:true})
        }
    })
}
})

router.post("/update/:id/:token", async(req, res)=>{
    try {
        let {id, token} = req.params;
        let finalResult = true;
        let {password} = req.body;
        let verifyToken = jwt.verify(token, process.env.key, (err, decode)=>{
            if(err){
                finalResult=false;
                return res.status(400).json({status:400, msg:"expired", resp:false})
            }
            else{
                finalResult = true;
            }
        })
        if(finalResult){
        let saltVal = await bcrypt.genSalt(10);
        let hashedPass = await bcrypt.hash(password, saltVal);
        let updatePassword = await updateNewPassword(id, hashedPass);
        if(!updatePassword.acknowledged){
            return res.status(400).json({status:400, msg:"not updated", resp:false})
        }
        return res.status(201).json({status:201, msg:"updated", resp:true})
    }
    } catch (error) {
        return res.status(500).json({ status: 500, msg: "server error", resp: false })
    }

})


export let userRoutes = router;
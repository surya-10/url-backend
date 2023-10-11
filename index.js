import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { client } from "./db.js";
import { userRoutes } from "./userRoutes/routes.js";
import cors from "cors";
import { url } from "./userRoutes/urlRoutes.js";


let app = express();
app.use(cors());
app.use(express.json());
app.use("/", userRoutes);
app.use("/auth", url);

let port = process.env.port;
app.listen(port, ()=>console.log("server connected"));
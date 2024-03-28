// index.js

import express from "express";
import cors from "cors";
import "dotenv/config";
import { bot } from "./controller/controller.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


app.post('*', async (req, res) => {
    
    return res.status(200).send({
        message: "Api is runnig like a butter"
    });
});

app.get('*', async (req, res) => {
    
    return res.status(200).send({
        message: "Api is runnig like a butter"
    });
});

app.listen(port, () => {
    console.log('Server is running on port', port);
});

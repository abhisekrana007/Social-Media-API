require('dotenv').config();

import express from 'express';
import bodyParser from 'body-parser';
import { uroutes } from './routes/user'

//const connectdb = require('./db/connect')

const app: express.Application = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

uroutes(app)

const port = process.env.port || 2000

app.listen(port, () => {
    console.log(`Listening to port ${port}...`)
})
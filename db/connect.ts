import { Pool } from 'pg'

require('dotenv').config()

const stringport: any = process.env.db_port
const portval: number = +stringport

export const pool = new Pool({
    user: process.env.db_username,
    password: process.env.db_password,
    host: process.env.db_host,
    port: portval,
    database: process.env.db_name,
})
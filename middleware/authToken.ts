import { Request, Response, NextFunction } from 'express';
import { tokenstr } from '../interface'
import jwt from 'jsonwebtoken'

require('dotenv').config()

export async function auth(req: Request, res: Response, next: NextFunction) {
    const bigtoken = req.headers.authorization
    if (!bigtoken || !bigtoken.startsWith('Bearer ')) {
        res.status(400).json('No token')
    }
    else {
        const token = bigtoken.split(' ')[1]
        const key = process.env.secret_key
        if (key) {
            try {
                const decode = jwt.verify(token, key)
                const { userid } = decode as tokenstr
                req.userid = userid
                next()
            } catch (error) {
                res.status(400).json(error)
            }
        }
        else {
            res.status(400).json('No JWT KEY has been set')
        }
    }
}
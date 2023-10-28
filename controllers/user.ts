import { Request, Response } from 'express';
require('express-async-errors');
require('dotenv').config()
import bcrypt from 'bcryptjs'
import { pool } from '../db/connect'
import jwt from 'jsonwebtoken'

export async function registerUser(req: Request, res: Response) {
    const { user } = req.body
    if (!user.username || !user.password) {
        return res.status(400).json('Please provide a Name and Password')
    }
    const findUserQuery: string = 'Select * from users where username = $1';
    const findUser = await pool.query(findUserQuery, [user.username])
    if (findUser.rowCount != 0) {
        return res.status(409).json("Username Already Exists");
    }
    else {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(user.password, salt)
        const query: string = 'INSERT INTO users (username, password, name, bio) VALUES ($1,$2,$3,$4) returning *'
        const userinfo = await pool.query(query, [user.username, hashedPassword, user.name, user.bio])
        const key = process.env.secret_key
        if (key) {
            const token: string = jwt.sign({ userid: userinfo.rows[0].userid }, key)
            return res.status(200).json(token)
        }
        else {
            return res.status(400).json('No JWT KEY has been set')
        }

    }
}

export async function loginUser(req: Request, res: Response) {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(404).json('Provide a Username and Password')
    }
    const query: string = 'SELECT * FROM users WHERE username = $1'
    const userinfo = await pool.query(query, [username])
    if (!userinfo) {
        return res.status(400).json('No User Exists')
    }
    const check = await bcrypt.compare(password, userinfo.rows[0].password)
    if (!check) {
        return res.status(400).json('Wrong Password')
    }
    const key = process.env.secret_key
    if (key) {
        const token = jwt.sign({ userid: userinfo.rows[0].userid }, key)
        return res.status(200).json(token)
    }
    else {
        return res.status(400).json('No JWT KEY has been set')
    }
}

export async function updateUser(req: Request, res: Response) {
    try {
        if (req.userid != req.params.userid) {
            return res.status(401).json('Unauthorized');
        }
        const { PatchData } = req.body;

        if (!PatchData) {
            return res.status(400).json('Please provide PatchData');
        }

        const findUserQuery: string = 'SELECT * FROM users WHERE userid = $1';
        const user = await pool.query(findUserQuery, [req.params.userid]);

        if (user.rowCount === 0) {
            return res.status(404).json('User not found');
        }

        let updateQuery: string = 'UPDATE users SET ';
        const updateValues: any[] = [];
        let oldPass = null;

        for (const key in PatchData) {
            if (Object.prototype.hasOwnProperty.call(PatchData, key)) {
                if (key == "oldPassword") {
                    oldPass = PatchData[key];
                }
                else if (key == "newPassword") {
                    if (oldPass != null) {
                        // const query: string = 'SELECT password FROM users WHERE userid = $1'
                        // const userinfo = await pool.query(query, [req.userid])
                        if (!user) {
                            return res.status(400).json('No User Exists')
                        }
                        const check = await bcrypt.compare(oldPass, user.rows[0].password)
                        if (check) {
                            const salt = await bcrypt.genSalt(10)
                            const hashedPassword = await bcrypt.hash(PatchData[key], salt)
                            updateQuery += `password = $${updateValues.length + 2}, `;
                            updateValues.push(hashedPassword);
                        }
                        else {
                            return res.status(409).json('Wrong Password Entered')
                        }
                    }
                    else {
                        return res.status(409).json('Provide Old Password to change to New Password');
                    }
                }
                else {
                    updateQuery += `${key} = $${updateValues.length + 2}, `;
                    updateValues.push(PatchData[key]);
                }

            }
        }

        updateQuery = updateQuery.slice(0, -2);

        updateQuery += ' WHERE userid = $1 returning *';

        // console.log(updateQuery);

        const result = await pool.query(updateQuery, [req.params.userid, ...updateValues]);

        if (result.rowCount === 0) {
            return res.status(404).json('No user data was updated');
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json('Internal server error');
    }

}


export async function getProfileById(req: Request, res: Response) {
    const query: string = 'Select * from users where userid = $1'
    const user = await pool.query(query, [req.params.userid]);
    if (user.rowCount != 0) {
        return res.status(200).json({ username: user.rows[0].username, name: user.rows[0].name, bio: user.rows[0].bio });
    }
    else {
        return res.status(404).json("No User Found")
    }
}

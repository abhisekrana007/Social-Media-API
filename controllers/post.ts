import { Request, Response } from 'express';
require('express-async-errors');
require('dotenv').config()
import { pool } from '../db/connect'

export async function getAllPosts(req: Request, res: Response) {
    const query: string = 'SELECT * from posts WHERE createdby != $1'
    const allPosts = await pool.query(query, [req.userid])
    return res.status(200).json(allPosts.rows)
}

export async function getPosts(req: Request, res: Response) {
    const query: string = 'SELECT * from posts WHERE createdby = $1'
    const userPosts = await pool.query(query, [req.params.userid])
    return res.status(200).json(userPosts.rows)
}

export async function createPosts(req: Request, res: Response) {
    const query: string = 'INSERT INTO posts (topic,description,createdby) VALUES ($1,$2,$3) returning *'
    const { topic, description } = req.body
    if (!topic) {
        return res.status(400).json('Please provide the topic')
    }
    const createdPost = await pool.query(query, [topic, description, req.userid])
    return res.status(200).json(createdPost.rows[0])
}

export async function deletePosts(req: Request, res: Response) {
    const findPostQuery: string = 'Select * from posts where id = $1';
    const findPost = await pool.query(findPostQuery, [req.params.postid])
    if (findPost.rowCount != 0) {
        if (req.userid == findPost.rows[0].createdby) {
            const query: string = 'DELETE FROM posts WHERE id = $1 returning *'
            const deletedPost = await pool.query(query, [req.params.postid])
            return res.status(200).json(deletedPost.rows[0])
        }
        else {
            return res.status(401).json("Unauthorized")
        }
    }
    else {
        return res.status(404).json("Post Doesn't Exist")
    }

}

export async function updatePosts(req: Request, res: Response) {
    const postId = req.params.postid;

    const findPostQuery: string = 'SELECT * FROM posts WHERE id = $1';
    const findPost = await pool.query(findPostQuery, [postId]);

    if (findPost.rowCount === 0) {
        return res.status(404).json("Post Doesn't Exist");
    }

    if (req.userid !== findPost.rows[0].createdby) {
        return res.status(401).json("Unauthorized");
    }

    const PatchData = req.body;

    let updatedTopic = findPost.rows[0].topic;
    let updatedDescription = findPost.rows[0].description;

    if (PatchData.topic !== undefined) {
        updatedTopic = PatchData.topic;
    }

    if (PatchData.description !== undefined) {
        updatedDescription = PatchData.description;
    }

    const updatePostQuery: string =
        'UPDATE posts SET topic = $1, description = $2 WHERE id = $3 RETURNING *';

    const updatedPost = await pool.query(updatePostQuery, [
        updatedTopic,
        updatedDescription,
        postId
    ]);

    return res.status(200).json(updatedPost.rows[0]);
}


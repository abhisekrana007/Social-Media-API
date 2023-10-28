import express from 'express'
import { registerUser, loginUser, updateUser, getProfileById } from '../controllers/user'
import { getAllPosts, getPosts, createPosts, deletePosts, updatePosts } from '../controllers/post'
import { auth } from '../middleware/authToken'

export function uroutes(app: express.Application) {
    app.post('/register', registerUser);
    app.post('/login', loginUser);
    app.route('/profile/:userid').get(auth, getProfileById).patch(auth, updateUser)
    app.route('/home').get(auth, getAllPosts).post(auth, createPosts);
    app.route('/home/:userid').get(auth, getPosts);
    app.route('/home/:postid').delete(auth, deletePosts).patch(auth, updatePosts)
}
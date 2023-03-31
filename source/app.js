"use strict";

const express = require ('express');
const mongoose = require ('mongoose');
const bodyParser = require ('body-parser');
require ('dotenv/config');

const app = express ();

// Add middleware to marshal JSON strings in HTTP request bodies into JS
// objects
app.use (bodyParser.json ());

// Load route objects
const versionRoute = require ('./routes/version');
const userRoute = require ('./routes/user');
const postRoute = require ('./routes/post');
const commentRoute = require ('./routes/comment');
const likeRoute = require ('./routes/like');

// Add routes
app.use ('/api/version', versionRoute);
app.use ('/api/user', userRoute);
app.use ('/api/post', postRoute);
app.use ('/api/comment', commentRoute);
app.use ('/api/like', likeRoute);

// Create URL object from URL string in order to extract the database name
const mongoDBURL = new URL (process.env.DB_URL);

// Connect to MongoDB
mongoose.set ('strictQuery', true);
mongoose.connect (mongoDBURL.href, () => {
	console.log ('MongoDB connected [' + mongoDBURL.pathname + '] ...');
});

// Open application up for requests
app.listen (process.env.APP_PORT, process.env.APP_HOST, () => {
	console.log ('Server is listening on ' + process.env.APP_HOST + ':' + process.env.APP_PORT + ' ...');
});

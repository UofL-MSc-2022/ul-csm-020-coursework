"use strict";

const express = require ('express');
const mongoose = require ('mongoose');
const bodyParser = require ('body-parser');
require ('dotenv/config');

const app = express ();

app.use (bodyParser.json ());

const versionRoute = require ('./routes/version');
const userRoute = require ('./routes/user');
const postRoute = require ('./routes/post');
const commentRoute = require ('./routes/comment');
const likeRoute = require ('./routes/like');

app.use ('/api/version', versionRoute);
app.use ('/api/user', userRoute);
app.use ('/api/post', postRoute);
app.use ('/api/comment', commentRoute);
app.use ('/api/like', likeRoute);

const mongo_db_url = new URL (process.env.DB_URL);

mongoose.set ('strictQuery', true);
mongoose.connect (mongo_db_url.href, () => {
	console.log ('MongoDB connected [' + mongo_db_url.pathname + '] ...');
});

app.listen (process.env.APP_PORT, process.env.APP_HOST, () => {
	console.log ('Server is listening on ' + process.env.APP_HOST + ':' + process.env.APP_PORT + ' ...');
});

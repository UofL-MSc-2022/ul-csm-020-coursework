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

app.use ('/api/version', versionRoute);
app.use ('/api/user', userRoute);
app.use ('/api/post', postRoute);
app.use ('/api/comment', commentRoute);

const mongo_db_url = new URL (process.env.NODE_ENV == 'prod' ? process.env.PROD_DB_URL : process.env.TEST_DB_URL);

mongoose.set ('strictQuery', true);
mongoose.connect (mongo_db_url.href, () => {
	console.log ('MongoDB connected [' + mongo_db_url.pathname + '] ...');
});

app.listen (3000, () => {
	console.log ('Server is running ...');
});

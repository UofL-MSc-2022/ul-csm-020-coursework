const express = require ('express');
const mongoose = require ('mongoose');
const bodyParser = require ('body-parser');
require ('dotenv/config');

const app = express ();

app.use (bodyParser.json ());

const userRoute = require ('./routes/user');

app.use ('/api/user', userRoute);

mongoose.set ('strictQuery', true);
mongoose.connect (process.env.DB_URL, () => { console.log ('MongoDB connected ...') });

app.listen (3000, () => {
	console.log ('Server is running ...')
});

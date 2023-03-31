const express = require ('express');
const packageJSON = require ('../../package.json');

const {jwtAuth} = require ('../auth/jwt');

const router = express.Router ();

router.get ('/', jwtAuth, (req, res) => {
	res.send ({version: packageJSON.version});
});

module.exports = router;

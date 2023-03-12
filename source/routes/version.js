const express = require ('express');
const package_config = require ('../../package.json');

const { jwtAuth } = require ('../auth/jwt');

const router = express.Router ();

router.get ('/', jwtAuth, async (req, res) => {
	res.send ({version: package_config.version});
});

module.exports = router;

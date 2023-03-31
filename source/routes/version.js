const express = require ('express');

const packageJSON = require ('../../package.json');

const router = express.Router ();

router.get ('/', (req, res) => {
	res.send ({version: packageJSON.version});
});

module.exports = router;

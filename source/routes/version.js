/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * Simple endpoint for determining current API version.  This endpoint is also
 * useful for verifying that the application is running without needing
 * authorization.
 */

const express = require ('express');

// Get the version string defined in package.json
const packageJSON = require ('../../package.json');

const router = express.Router ();

router.get ('/', (req, res) => {
	res.send ({version: packageJSON.version});
});

module.exports = router;

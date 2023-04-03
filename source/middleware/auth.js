/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * Express pipeline function to verify access tokens.
 */

const {UserModel} = require ('../models/user');
const {verifyAccessToken} = require ('../auth/jwt');

// Verifies the auth token specified in the Authorization HTTP Request header,
// per RFC 6750.  If a token is verified, the authorized user is loaded from
// the database using the id in the token payload, adds the user to request
// object, and passes control down the middleware chain.  If a token is not
// verified, break the middleware chain and send of 401 error response.
async function jwtAuth (req, res, next) {
	try {
		const token_header = req.header ('Authorization');

		if (! token_header || ! token_header.startsWith ('Bearer '))
			return res.status (401).send ({message: 'Missing bearer token'});

		// Remove the 'Bearer ' prefix and extract the token string.
		const token = token_header.substring (6).trim ();

		// Decodes the payload if the token is valid, otherwise an error is
		// thrown.
		payload = verifyAccessToken (token);

		// Add the user to the request object, req.
		req.user = await UserModel.findById (payload.sub);

		// The token was valid, but the payload wasn't.
		if (req.user == null)
			return res.status (401).send ({message: 'Unknown user'});

		next ();
	}
	catch (error) {
		if (error.name == 'TokenExpiredError')
			message = 'Token has expired';
		else
			message = 'Access denied';

		return res.status (401).send ({message: message});
	}
}

module.exports.jwtAuth = jwtAuth;

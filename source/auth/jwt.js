/* Helper functions to manage the creation and verification of access tokens.
 * The public/private key pair should be defined in the .env file and they must
 * have a minimum modulus of 2048.
 */

const jwt = require ('jsonwebtoken');
const crypto = require ('crypto');
const config = require ('config');

const {UserModel} = require ('../models/user');

const RSA_ALGORITHM = 'RS256';

// Subject should be a string user id.
function createAccessToken (subject) {
	const now = Date.now ();

	// Place the user id into the token payload so the user associated with an
	// API request corresponds securely with the user that signed in.
	const payload = {sub: subject};

	token_options = {
		algorithm: RSA_ALGORITHM,
		expiresIn: config.get ('jwt_access_token_expiry'),
		jwtid: crypto.randomUUID ()
	};

	return jwt.sign (payload, process.env.JWT_PRIVATE_KEY, token_options);
}

function verifyAccessToken (token) {
	token_options = {algorithm: RSA_ALGORITHM};

	// The verify function returns the decoded payload, or it throws an error.
	return jwt.verify (token, process.env.JWT_PUBLIC_KEY, token_options);
}

module.exports.createAccessToken = createAccessToken;
module.exports.verifyAccessToken = verifyAccessToken;

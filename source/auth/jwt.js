const jwt = require ('jsonwebtoken');
const crypto = require ('crypto');
const config = require ('config');
const fs = require ('fs');

function createAccessToken (subject) {
	const now = Date.now ();

	payload = {
		typ: 'acc',
		sub: subject
	};

	token_options = {
		algorithm: 'RS256',
		expiresIn: config.get ('jwt_access_token_expiry'),
		jwtid: crypto.randomUUID ()
	};

	return jwt.sign (payload, process.env.JWT_PRIVATE_KEY, token_options);
}

module.exports.createAccessToken = createAccessToken

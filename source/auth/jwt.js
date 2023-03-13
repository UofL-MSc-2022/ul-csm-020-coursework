const jwt = require ('jsonwebtoken');
const crypto = require ('crypto');
const config = require ('config');

const { UserModel } = require ('../models/user');

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

function verifyAccessToken (token) {
	token_options = { algorithm: 'RS256' };

	return jwt.verify (token, process.env.JWT_PUBLIC_KEY, token_options);
}

async function jwtAuth (req, res, next) {
	try {
		const token_header = req.header ('Authorization');

		if (! token_header || ! token_header.startsWith ('Bearer '))
			return res.status (401).send ({message: 'Missing bearer token'});

		const token = token_header.substring (6).trim ();

		payload = verifyAccessToken (token);

		req.user = await UserModel.findById (payload.sub);

		if (req.user == null)
			return res.status (401).send ({message: 'Unknown user'});

		next ()
	}
	catch (err) {
		if (err.name == 'TokenExpiredError')
			msg = 'Token has expired';
		else
			msg = 'Access denied';

		return res.status (401).send ({message: msg});
	}
}

module.exports.createAccessToken = createAccessToken;
module.exports.verifyAccessToken = verifyAccessToken;
module.exports.jwtAuth = jwtAuth;

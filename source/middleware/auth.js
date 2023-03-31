const {UserModel} = require ('../models/user');
const {verifyAccessToken} = require ('../auth/jwt');

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

		next ();
	}
	catch (err) {
		if (err.name == 'TokenExpiredError')
			msg = 'Token has expired';
		else
			msg = 'Access denied';

		return res.status (401).send ({message: msg});
	}
}

module.exports.jwtAuth = jwtAuth;

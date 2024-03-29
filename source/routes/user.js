/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * User registration and authentication logic.
 */

const express = require ('express');

const router = express.Router ();

const {UserModel, createUser} = require ('../models/user');
const {validateRegister, validateSignIn} = require ('../validation/user');
const {createAccessToken} = require ('../auth/jwt');

router.post ('/register', async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = validateRegister (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		newUser = await createUser (req.body.screen_name, req.body.email, req.body.password);

		res.send (newUser);
	}
	catch (error) {
		// Error code 11000 is a uniqueness constraint violation.  The error
		// object may not contain a code parameter, in which error.code will be
		// undefined.  This is fine because undefined != 11000 and the else
		// condition will be triggered.
		if (error.code == 11000)
			message = "User already exists";
		else
			message = error;

		res.status (400).send ({message: message});
	}
});

router.post ('/sign-in', async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = validateSignIn (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		// By default, UserModels will not contain the password hash.  It is
		// necessary to override with by explicitly selecting the password
		// field here.
		const user = await UserModel.findOne ({email: req.body.email}).select ('+password');

		if (! user)
			return res.status (401).send ({message: 'User does not exist'});

		if (! await user.validPassword (req.body.password))
			return res.status (401).send ({message: 'Password is not correct'});

		const token = createAccessToken (user.id);

		res.send ({'auth-token': token});
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

module.exports = router;

const express = require ('express');

const router = express.Router ();

const {UserModel, createUser} = require ('../models/user');
const {registerValidation, signInValidation} = require ('../validations/user-validation');
const {createAccessToken} = require ('../auth/jwt');

router.post ('/register', async (req, res) => {
	try {
		const {error} = registerValidation (req.body);

		if (error)
			return res.status (400).send ({message: error.details[0].message});

		new_user = await createUser (req.body.screen_name, req.body.email, req.body.password);

		res.send (new_user);
	}
	catch (err) {
		if (err.code == 11000)
			msg = "User already exists";
		else
			msg = err

		res.status (400).send ({message: msg});
	}
});

router.post ('/sign-in', async (req, res) => {
	try {
		const {error} = signInValidation (req.body);

		if (error)
			return res.status (400).send ({message: error.details[0].message});

		// Override select password set to false by User schema
		const user = await UserModel.findOne ({email: req.body.email}).select ('+password');

		if (! user)
			return res.status (401).send ({message: 'User does not exist.'});

		if (! await user.validPassword (req.body.password))
			return res.status (401).send ({message: 'Password is not correct.'});

		const token = createAccessToken (user.id);

		res.send ({'auth-token': token});
	}
	catch (err) {
		res.status (400).send ({message: err});
	}
});

module.exports = router;

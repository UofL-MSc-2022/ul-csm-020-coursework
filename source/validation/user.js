const joi = require ('joi');

const {userValidationFields} = require ('../models/user');

const registerSchema = joi.object ({
	screen_name: userValidationFields.screen_name,
	email: userValidationFields.email,
	password: userValidationFields.password
});

const signInSchema = joi.object ({
	email: userValidationFields.email,
	password: userValidationFields.password
});

function validateRegister (data) {
	return registerSchema.validate (data);
}

function validateSignIn (data) {
	return signInSchema.validate (data);
}

module.exports.validateRegister = validateRegister;
module.exports.validateSignIn = validateSignIn;

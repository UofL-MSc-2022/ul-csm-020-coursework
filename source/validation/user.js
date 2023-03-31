const joi = require ('joi');

// Use field definitions from model module.
const {userValidationFields} = require ('../models/user');

// Define validation schemas.
const registerSchema = joi.object ({
	screen_name: userValidationFields.screen_name,
	email: userValidationFields.email,
	password: userValidationFields.password
});

const signInSchema = joi.object ({
	email: userValidationFields.email,
	password: userValidationFields.password
});

// Create helper functions to apply validation schemas.
function validateRegister (data) {
	return registerSchema.validate (data);
}

function validateSignIn (data) {
	return signInSchema.validate (data);
}

module.exports.validateRegister = validateRegister;
module.exports.validateSignIn = validateSignIn;

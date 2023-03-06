const joi = require ('joi')

const { userValidationFields } = require ('../models/user')

const registerValidation = (data) => {
	const schemaValidation = joi.object ({
		screen_name: userValidationFields.screen_name,
		email: userValidationFields.email,
		password: userValidationFields.password
	})

	return schemaValidation.validate (data)
}

const signInValidation = (data) => {
	const schemaValidation = joi.object ({
		email: userValidationFields.email,
		password: userValidationFields.password
	})

	return schemaValidation.validate (data)
}

module.exports.registerValidation = registerValidation
module.exports.signInValidation = signInValidation

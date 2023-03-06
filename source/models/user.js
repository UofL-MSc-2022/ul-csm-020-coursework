const mongoose = require ('mongoose')
const joi = require ('joi')

const userSchema = mongoose.Schema ({
	screen_name: { type: String, required: true, min: 3, max: 256 },
	email: { type: String, required: true, min: 6, max: 256 },
	password: { type: String, required: true, min: 6, max: 1024 },
	date: { type: Date, default: Date.now }
})

const userValidationFields = {
	screen_name: joi.string ().required ()
		.min (userSchema.obj.screen_name.min).max (userSchema.obj.screen_name.max),
	email: joi.string ().required ()
		.min (userSchema.obj.email.min).max (userSchema.obj.email.max)
		.email (),
	password: joi.string ().required ()
		.min (userSchema.obj.password.min).max (userSchema.obj.password.max)
}

module.exports.UserModel = mongoose.model ('users', userSchema)
module.exports.userValidationFields = userValidationFields

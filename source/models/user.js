const mongoose = require ('mongoose');
const joi = require ('joi');
const bcryptjs = require ('bcryptjs');

const userSchema = mongoose.Schema ({
	screen_name: { type: String, required: true, min: 3, max: 256 },
	email: { type: String, index: true, unique: true, required: true, min: 6, max: 256 },
	password: { type: String, required: true, min: 6, max: 1024 },
	date: { type: Date, default: Date.now }
});

userSchema.methods.validPassword = async function (password) {
	return await bcryptjs.compare (password, this.password);
};

const userValidationFields = {
	screen_name: joi.string ().required ()
		.min (userSchema.obj.screen_name.min).max (userSchema.obj.screen_name.max),
	email: joi.string ().required ()
		.min (userSchema.obj.email.min).max (userSchema.obj.email.max)
		.email (),
	password: joi.string ().required ()
		.min (userSchema.obj.password.min).max (userSchema.obj.password.max)
};

const UserModel = mongoose.model ('users', userSchema);

async function createUser (screen_name, email, password_plain) {
	const salt = await bcryptjs.genSalt (5);
	const password_crypt = await bcryptjs.hash (password_plain, salt);

	return await UserModel.create ({
		screen_name: screen_name,
		email: email,
		password: password_crypt
	});
}

module.exports.UserModel = UserModel;
module.exports.userValidationFields = userValidationFields;
module.exports.createUser = createUser;

/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * User model and field validation definitions.
 */

const mongoose = require ('mongoose');
const joi = require ('joi');
const bcryptjs = require ('bcryptjs');

// Create the schema for User objects.  Set select=false for email and password
// so that they will not appear in a query result (and by extension, an API
// response).  Make email a unique index so that if a user tries to register
// with an existing email address, Mongoose will throw an error preventing the
// duplicate registration.  Setting the timestamps option allows Mongoose to
// manage createdAt and updatedAt times automatically.
const userSchema = mongoose.Schema ({
	screen_name: {type: String, required: true, min: 3, max: 256},
	email: {type: String, index: true, unique: true, required: true, select: false, min: 6, max: 256},
	password: {type: String, required: true, select: false, min: 6, max: 1024},
}, {timestamps: true});

// Hide id and __v from API responses.
userSchema.set ('toJSON', {
	transform: (orig, conv) => {
		delete conv.id;
		delete conv._id;
		delete conv.__v;
	}
});

// User object member method which validates a given password.
userSchema.methods.validPassword = async function (password) {
	return await bcryptjs.compare (password, this.password);
};

// Create a list of validation fields in the model file since the parameters
// are taken directly from the model schema.
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

// Helper function to keep the User creation logic in the model module.
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

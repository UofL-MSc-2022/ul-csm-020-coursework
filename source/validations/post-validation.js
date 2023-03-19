const joi = require ('joi');

const { UserModel } = require ('../models/user');
const { PostModel, postValidationFields } = require ('../models/post');

const createSchema = joi.object ({
	title: postValidationFields.title,
	body: postValidationFields.body });

const createValidation = (data) => {
	return createSchema.validate (data);
};

const updateSchema = createSchema.fork (['title', 'body'], field => field.optional ()).min (1);

const updateValidation = (data) => {
	return updateSchema.validate (data);
};

async function validatePostID (req, res, next) {
	try {
		req.post = await PostModel.findById (req.params.post_id).populate ({path: 'owner', model: UserModel});

		if (! req.post)
			return res.status (400).send ({message: "No post with id " + req.params.post_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

module.exports.createValidation = createValidation;
module.exports.updateValidation = updateValidation;
module.exports.validatePostID = validatePostID;

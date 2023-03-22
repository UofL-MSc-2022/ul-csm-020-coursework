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
		req.post = await PostModel.findById (req.params.post_id);

		if (! req.post)
			return res.status (400).send ({message: "No post with id " + req.params.post_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

function verifyNotPostOwner (req, res, next) {
	if (req.post.owner.toString () == req.user.id)
		return res.status (401).send ({message: "Signed in user is the post owner"});

	next ();
}

module.exports.createValidation = createValidation;
module.exports.updateValidation = updateValidation;
module.exports.validatePostID = validatePostID;
module.exports.verifyNotPostOwner = verifyNotPostOwner;

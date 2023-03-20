const joi = require ('joi');

const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { CommentModel, commentValidationFields } = require ('../models/comment');

const writeValidation = (data) => {
	const schemaValidation = joi.object ({
		body: commentValidationFields.body });

	return schemaValidation.validate (data);
};

async function validateCommentID (req, res, next) {
	try {
		req.comment = await CommentModel.findById (req.params.comment_id)
			.populate ([
				{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
				{path: 'author', model: UserModel} ]);

		if (! req.comment)
			return res.status (400).send ({message: "No comment with id " + req.params.comment_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

module.exports.writeValidation = writeValidation;
module.exports.validateCommentID = validateCommentID;

const joi = require ('joi');

const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { CommentModel, commentValidationFields } = require ('../models/comment');

const writeValidation = (data) => {
	const schemaValidation = joi.object ({
		body: commentValidationFields.body });

	return schemaValidation.validate (data);
};

module.exports.writeValidation = writeValidation;

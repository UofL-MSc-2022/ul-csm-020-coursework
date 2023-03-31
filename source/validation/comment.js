const joi = require ('joi');

const {commentValidationFields } = require ('../models/comment');

const writeSchema = joi.object ({
	body: commentValidationFields.body
});

// Validation is the same for create and update, use validateWrite for both.
function validateWrite (data) {
	return writeSchema.validate (data);
}

module.exports.validateWrite = validateWrite;

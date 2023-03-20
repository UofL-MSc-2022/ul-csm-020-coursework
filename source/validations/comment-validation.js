const joi = require ('joi');

const { commentValidationFields } = require ('../models/comment');

const writeValidation = (data) => {
	const schemaValidation = joi.object ({
		body: commentValidationFields.body });

	return schemaValidation.validate (data);
};

module.exports.writeValidation = writeValidation;

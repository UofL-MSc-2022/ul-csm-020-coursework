const joi = require ('joi');

const { postValidationFields } = require ('../models/post');

const createValidation = (data) => {
	const schemaValidation = joi.object ({
		title: postValidationFields.title,
		body: postValidationFields.body
	});

	return schemaValidation.validate (data);
};

module.exports.createValidation = createValidation;

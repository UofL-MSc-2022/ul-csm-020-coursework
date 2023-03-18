const joi = require ('joi');

const { postValidationFields } = require ('../models/post');

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

module.exports.createValidation = createValidation;
module.exports.updateValidation = updateValidation;

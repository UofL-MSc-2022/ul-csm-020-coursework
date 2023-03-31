const joi = require ('joi');

const {postValidationFields} = require ('../models/post');

const createSchema = joi.object ({
	title: postValidationFields.title,
	body: postValidationFields.body
});

// Allow fields to be optional for update, however require a minimum of one
// field to be present.
const updateSchema = createSchema.fork (['title', 'body'], field => field.optional ()).min (1);

function validateCreate (data) {
	return createSchema.validate (data);
}

function validateUpdate (data) {
	return updateSchema.validate (data);
}

module.exports.validateCreate = validateCreate;
module.exports.validateUpdate = validateUpdate;

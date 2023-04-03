/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * Validation schema for posts.
 */

const joi = require ('joi');

// Use field definitions from model module.
const {postValidationFields} = require ('../models/post');

// Define validation schemas.
const createSchema = joi.object ({
	title: postValidationFields.title,
	body: postValidationFields.body
});

// Allow fields to be optional for update, however require a minimum of one
// field to be present.
const updateSchema = createSchema.fork (['title', 'body'], field => field.optional ()).min (1);

// Create helper functions to apply validation schemas.
function validateCreate (data) {
	return createSchema.validate (data);
}

function validateUpdate (data) {
	return updateSchema.validate (data);
}

module.exports.validateCreate = validateCreate;
module.exports.validateUpdate = validateUpdate;

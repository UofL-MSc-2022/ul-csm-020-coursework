const joi = require ('joi');

// Use field definitions from model module.
const {commentValidationFields } = require ('../models/comment');

// Define validation schema.  Validation is the same for create and update, use
// the same schema for both.
const writeSchema = joi.object ({
	body: commentValidationFields.body
});

// Create helper function to apply validation schema.
function validateWrite (data) {
	return writeSchema.validate (data);
}

module.exports.validateWrite = validateWrite;

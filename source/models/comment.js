/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * Comment model and field validation definitions.
 */

const mongoose = require ('mongoose');
const joi = require ('joi');

// Create the schema for Comment objects.  Setting the timestamps option allows
// Mongoose to manage createdAt and updatedAt times automatically.
const commentSchema = mongoose.Schema ({
	// Foreign key to the posts collection.
	post: {type: mongoose.Schema.Types.ObjectId, ref: 'PostModel', required: true},
	body: {type: String, required: true, min: 3, max: 1024},
	// Foreign key to the users collection.
	author: {type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true}
}, {timestamps: true});

// Create a list of validation fields in the model file since the parameters
// are taken directly from the model schema.
const commentValidationFields = {
	body: joi.string ().required ().min (commentSchema.obj.body.min).max (commentSchema.obj.body.max)
};

module.exports.CommentModel = mongoose.model ('comments', commentSchema);
module.exports.commentValidationFields = commentValidationFields;

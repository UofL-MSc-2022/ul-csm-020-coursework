const mongoose = require ('mongoose');
const joi = require ('joi');

const commentSchema = mongoose.Schema ({
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'PostModel', required: true },
	body: { type: String, required: true, min: 3, max: 1024 },
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
	date: { type: Date, default: Date.now }
});

const commentValidationFields = {
	body: joi.string ().required ().min (commentSchema.obj.body.min).max (commentSchema.obj.body.max)
};

module.exports.CommentModel = mongoose.model ('comments', commentSchema);
module.exports.commentValidationFields = commentValidationFields;

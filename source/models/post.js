const mongoose = require ('mongoose');
const joi = require ('joi');

const postSchema = mongoose.Schema ({
	title: { type: String, required: true, min: 3, max: 256 },
	body: { type: String, required: true, min: 3, max: 1024 },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
	comments: [ { type: mongoose.Schema.Types.ObjectId, ref: 'CommentModel', select: false }],
	likes: [ { type: mongoose.Schema.Types.ObjectId, ref: 'LikeModel', select: false }],
	n_likes: { type: Number, select: false },
	date: { type: Date, default: Date.now }
});

const postValidationFields = {
	title: joi.string ().required ().min (postSchema.obj.title.min).max (postSchema.obj.title.max),
	body: joi.string ().required ().min (postSchema.obj.body.min).max (postSchema.obj.body.max)
};

module.exports.PostModel = mongoose.model ('posts', postSchema);
module.exports.postValidationFields = postValidationFields;

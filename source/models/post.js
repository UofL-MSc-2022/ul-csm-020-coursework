const mongoose = require ('mongoose');
const joi = require ('joi');

const { CommentModel } = require ('./comment');
const { LikeModel } = require ('./like');

const postSchema = mongoose.Schema ({
	title: { type: String, required: true, min: 3, max: 256 },
	body: { type: String, required: true, min: 3, max: 1024 },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
	comments: {
		type: [{type: mongoose.Schema.Types.ObjectId, ref: 'CommentModel'}],
		default: undefined,
		select: false },
	likes: {
		type: [{type: mongoose.Schema.Types.ObjectId, ref: 'LikeModel'}],
		default: undefined,
		select: false },
	n_likes: { type: Number, select: false }
}, {timestamps: true});

postSchema.pre ('deleteOne', async function () {
	const post_id = this.getFilter ()._id;

	await CommentModel.deleteMany ({post: post_id});
	await LikeModel.deleteMany ({post: post_id});
});

const postValidationFields = {
	title: joi.string ().required ().min (postSchema.obj.title.min).max (postSchema.obj.title.max),
	body: joi.string ().required ().min (postSchema.obj.body.min).max (postSchema.obj.body.max)
};

module.exports.PostModel = mongoose.model ('posts', postSchema);
module.exports.postValidationFields = postValidationFields;

const mongoose = require ('mongoose');
const joi = require ('joi');

const {CommentModel} = require ('./comment');
const {LikeModel} = require ('./like');

// Create the schema for Post objects.  Hide __v from queries and API
// responses.  Setting the timestamps option allows Mongoose to manage
// createdAt and updatedAt times automatically.
const postSchema = mongoose.Schema ({
	title: {type: String, required: true, min: 3, max: 256},
	body: {type: String, required: true, min: 3, max: 1024},
	// Foreign key to the users collection.
	owner: {type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true},
	comments: {
		type: [{type: mongoose.Schema.Types.ObjectId, ref: 'CommentModel'}],
		// Unhydrated comments will appear as an empty array unless the default
		// is set to undefined.
		default: undefined,
		select: false
	},
	likes: {
		type: [{type: mongoose.Schema.Types.ObjectId, ref: 'LikeModel'}],
		// Unhydrated likes will appear as an empty array unless the default is
		// set to undefined.
		default: undefined,
		select: false
	},
	// The n_likes field is only created by the aggregate method, it should not
	// appear outside of that context.
	n_likes: {type: Number, select: false},
	__v: {type: Number, select: false}
}, {timestamps: true});

// If the post is deleted, the post's comments and likes should also be
// deleted, similar to cascading deletion from standard ORMs.  Currently, only
// deleteOne is used to remove posts from the database, so it is the only
// function necessary to hook.  The pre hook is chosen instead of a post-hook.
// With a post hook, if there is an error immediately after the successful
// deletion of the post, e.g. server crash, then there will be orphaned
// comments and likes.
postSchema.pre ('deleteOne', async function () {
	// The this reference points to the Query object that was created by the
	// deleteOne invocation.  Currently, all deleteOne functions on a Post
	// object use the post id for the filter.
	const post_id = this.getFilter ()._id;

	await CommentModel.deleteMany ({post: post_id});
	await LikeModel.deleteMany ({post: post_id});
});

// Create a list of validation fields in the model file since the parameters
// are taken directly from the model schema.
const postValidationFields = {
	title: joi.string ().required ().min (postSchema.obj.title.min).max (postSchema.obj.title.max),
	body: joi.string ().required ().min (postSchema.obj.body.min).max (postSchema.obj.body.max)
};

module.exports.PostModel = mongoose.model ('posts', postSchema);
module.exports.postValidationFields = postValidationFields;

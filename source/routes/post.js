/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * CRUD logic for posts.
 */

const express = require ('express');

// Models
const {UserModel} = require ('../models/user');
const {PostModel} = require ('../models/post');
const {CommentModel} = require ('../models/comment');
const {LikeModel} = require ('../models/like');

// Validation
const {validateCreate, validateUpdate} = require ('../validation/post');

// Middleware
const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyPostOwner} = require ('../middleware/post');

const router = express.Router ();

router.post ('/create', jwtAuth, async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = validateCreate (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		let newPost = await PostModel.create ({
			title: req.body.title,
			body: req.body.body,
			owner: req.user
		})

		// Hide the owner field, that is the owner id, from the response.  In
		// order to remove the property, the Mongoose document, CommentModel,
		// must be converted to a JSON object.
		newPost = newPost.toJSON ();
		delete newPost.owner;

		res.send (newPost);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

// The :post_id parameter is required for validatePostID
router.get ('/read/:post_id', jwtAuth, validatePostID, async (req, res) => {
	try {
		// Hydrate the foreign keys in the post object.
		req.post.comments = await CommentModel.find ({post: req.post});
		req.post.likes = await LikeModel.find ({post: req.post});
		req.post.n_likes = req.post.likes.length;

		await req.post.populate ([
			{path: 'owner', model: UserModel},
			{
				path: 'comments',
				model: CommentModel,
				populate: {path: 'author', model: UserModel},
				options: {sort: {createdAt: 'ascending'}},
				select: '-post'
			},
			{
				path: 'likes',
				model: LikeModel,
				populate: {path: 'backer', model: UserModel},
				options: {sort: {createdAt: 'ascending'}},
				select: '-post'
			}
		]);

		res.send (req.post);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

// The :post_id parameter is required for validatePostID and verifyPostOwner
router.patch ('/update/:post_id', jwtAuth, validatePostID, verifyPostOwner, async (req, res) => {
	try {
		// Both fields are optional, however at least one field must be sent.
		const validation = validateUpdate (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: "At least one parameter must be set"});

		// The updateOne method returns a summary of the update operation.
		// This endpoint returns the new object with the updated data and it
		// must be loaded from the database after updateOne completes.  Hide
		// the owner field to prevent user ids from being sent in an API
		// response.
		await req.post.updateOne (req.body);
		req.post = await PostModel.findById (req.post.id,).select ('-owner');

		res.send (req.post);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

// The :post_id parameter is required for validatePostID and verifyPostOwner
router.delete ('/delete/:post_id', jwtAuth, validatePostID, verifyPostOwner, async (req, res) => {
	try {
		// The deleteOne function returns a summary of the delete action,
		// return this to the end user.  The raw id field, _id, must be used
		// explicitly.
		const summary = await PostModel.deleteOne ({_id: req.post.id});

		res.send (summary);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.get ('/list/:scope(all|user)', jwtAuth, async (req, res) => {
	try {
		// If scope == 'all', use an empty filter, otherwise filter post owner
		// by authorised user.  The filter object for $match will not
		// introspect a Mongoose document object, therefore the raw id field,
		// _id, must be explicitly referenced.
		let filter = {};
		if (req.params.scope == 'user')
			filter = {owner: req.user._id};

		// Use the aggregate method in order to count the number of likes to
		// hydrate the n_likes field.
		const postsAggregate = PostModel.aggregate ([
			{$match: filter},
			// Alias _id to id.
			{$addFields: {id: "$_id"}},
			{$lookup: {from: 'likes', localField: '_id', foreignField: 'post', as: 'likes'}},
			{$set: {n_likes: {$size: '$likes'}}},
			// The array of likes must be hydrated in order to count them,
			// however the API does not include that array for the response
			// with this endpoint.  Therefore it must first be included and
			// then later unset.  Also hide the __v and _id fields.
			{$unset: ['_id', 'likes', '__v']},
			// The $sort option uses 1 for ascending, -1 for descending.
			{$sort: {n_likes: -1, createdAt: 1}}
		]);

		// When a user requests only their posts, the owner field is skipped.
		if (req.params.scope == 'user')
			postsAggregate.append ({$unset: 'owner'});

		const posts = await postsAggregate.exec ();

		if (req.params.scope == 'all')
			await PostModel.populate (posts, {path: 'owner', model: UserModel});

		res.send (posts);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

module.exports = router;

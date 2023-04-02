const express = require ('express');

// Models
const {UserModel} = require ('../models/user');
const {PostModel} = require ('../models/post');
const {CommentModel} = require ('../models/comment');

// Validation
const {validateWrite} = require ('../validation/comment');

// Middleware
const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyNotPostOwner} = require ('../middleware/post');
const {validateCommentID, verifyCommentAuthor} = require ('../middleware/comment');

const router = express.Router ();

router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = validateWrite (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		let newComment = await CommentModel.create ({
			post: req.post,
			body: req.body.body,
			author: req.user
		});

		// Hide the author field, that is the owner id, from the response.  In
		// order to remove the property, the Mongoose document, CommentModel,
		// must be converted to a JSON object.
		newComment = newComment.toJSON ();
		delete newComment.author;

		res.send (newComment);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.get ('/read/:comment_id', jwtAuth, validateCommentID, async (req, res) => {
	try {
		// Hydration happens at two levels: comment -> post -> owner.
		await req.comment.populate ([
			{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
			{path: 'author', model: UserModel}
		]);

		res.send (req.comment);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.patch ('/update/:comment_id', jwtAuth, validateCommentID, verifyCommentAuthor, async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = validateWrite (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		// The updateOne method returns a summary of the update operation.
		// This endpoint returns the new object with the updated data and it
		// must be loaded from the database after updateOne completes.  Hide
		// the author field to prevent user ids from being sent in an API
		// response.
		await req.comment.updateOne (req.body);
		req.comment = await CommentModel.findById (req.comment.id).select ('-author');

		res.send (req.comment);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.delete ('/delete/:comment_id', jwtAuth, validateCommentID, verifyCommentAuthor, async (req, res) => {
	try {
		// The deleteOne function returns a summary of the delete action,
		// return this to the end user.  The raw id field, _id, must be used
		// explicitly.
		const summary = await CommentModel.deleteOne ({_id: req.comment.id});

		res.send (summary);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.get ('/list/:scope(all|user)', jwtAuth, async (req, res) => {
	try {
		// If scope == 'all', use an empty filter, otherwise filter comment
		// owner by authorised user.
		let filter = {};
		if (req.params.scope == 'user')
			filter = {author: req.user};

		// Hydration happens at two levels: comment -> post -> owner.
		const commentsQuery = CommentModel.find (filter)
			.sort ({createdAt: 'ascending'})
			.populate ([
				{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
				{path: 'author', model: UserModel}
			]);

		// When a user requests only their comments, the author field is
		// skipped.
		if (req.params.scope == 'user')
			commentsQuery.select ('-author');

		res.send (await commentsQuery.exec ());
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

module.exports = router;

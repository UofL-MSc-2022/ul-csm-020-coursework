const express = require ('express');

// Models
const {UserModel} = require ('../models/user');
const {PostModel} = require ('../models/post');
const {CommentModel} = require ('../models/comment');

// Validation
const {writeValidation} = require ('../validations/comment-validation');

// Middleware
const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyNotPostOwner} = require ('../middleware/post');
const {validateCommentID, verifyCommentAuthor} = require ('../middleware/comment');

const router = express.Router ();

router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = writeValidation (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		const newComment = await CommentModel.create ({
			post: req.post,
			body: req.body.body,
			author: req.user
		});

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
			{path: 'author', model: UserModel} ]);

		res.send (req.comment);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.patch ('/update/:comment_id', jwtAuth, validateCommentID, verifyCommentAuthor, async (req, res) => {
	try {
		// Validate request parameters against schema.
		const validation = writeValidation (req.body);
		if ('error' in validation)
			return res.status (400).send ({message: validation.error.details[0].message});

		// The updateOne method returns a summary of the update operation.
		// This endpoint returns the new object with the updated data and it
		// must be loaded from the database after updateOne completes.
		await req.comment.updateOne (req.body);
		req.comment = await CommentModel.findById (req.comment.id);

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
		// If scope == 'all', use an empty filter, otherwise filter post owner
		// by authorised user.
		var filter = {};
		if (req.params.scope == 'user')
			filter = {author: req.user};

		// Hydration happens at two levels: comment -> post -> owner.
		const comments = await CommentModel.find (filter)
			.sort ({createdAt: 1})
			.populate ([
				{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
				{path: 'author', model: UserModel}
			]);

		res.send (comments);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

module.exports = router;

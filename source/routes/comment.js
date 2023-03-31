const express = require ('express');

const router = express.Router ();

const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { CommentModel } = require ('../models/comment');
const { writeValidation } = require ('../validations/comment-validation');

const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyNotPostOwner} = require ('../middleware/post');
const {validateCommentID, verifyCommentAuthor} = require ('../middleware/comment');

router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		const {error} = writeValidation (req.body);

		if (error)
			return res.status (400).send ({message: error ['details'] [0] ['message']});

		res.send (await CommentModel.create ({
			post: req.post,
			body: req.body.body,
			author: req.user
		}));
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.get ('/read/:comment_id', jwtAuth, validateCommentID, async (req, res) => {
	try {
		await req.comment.populate ([
			{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
			{path: 'author', model: UserModel} ]);

		res.send (req.comment);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.patch ('/update/:comment_id', jwtAuth, validateCommentID, verifyCommentAuthor, async (req, res) => {
	try {
		const {error} = writeValidation (req.body);

		if (error)
			return res.status (400).send ({message: error ['details'] [0] ['message']});

		await req.comment.updateOne (req.body);
		req.comment = await CommentModel.findById (req.comment.id);

		res.send (req.comment);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.delete ('/delete/:comment_id', jwtAuth, validateCommentID, verifyCommentAuthor, async (req, res) => {
	try {
		res.send (await CommentModel.deleteOne ({_id: req.comment.id}));
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.get ('/list/:scope(all|user)', jwtAuth, async (req, res) => {
	try {
		var filter = {};
		if (req.params.scope == 'user')
			filter = {author: req.user.id};

		const comments = await CommentModel.find (filter)
			.sort ({createdAt: 1})
			.populate (
				[
					{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
					{path: 'author', model: UserModel} ]);

		res.send (comments);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

module.exports = router;

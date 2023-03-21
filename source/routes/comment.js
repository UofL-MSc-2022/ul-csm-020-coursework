const express = require ('express');

const router = express.Router ();

const { CommentModel } = require ('../models/comment');
const { validatePostID } = require ('../validations/post-validation');
const { writeValidation, validateCommentID } = require ('../validations/comment-validation');
const { jwtAuth } = require ('../auth/jwt');

function verifyNotPostOwner (req, res, next) {
	if (req.post.owner.id == req.user.id)
		return res.status (401).send ({message: "Signed in user is the post owner"});

	next ();
}

function verifyCommentAuthor (req, res, next) {
	if (req.comment.author.id != req.user.id)
		return res.status (401).send ({message: "Signed in user is not the comment author"});

	next ();
}

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

router.get ('/read/:comment_id', jwtAuth, validateCommentID, (req, res) => {
	try {
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

module.exports = router;

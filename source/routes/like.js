const express = require ('express');

const router = express.Router ();

const { LikeModel } = require ('../models/like');
const { validatePostID, verifyNotPostOwner } = require ('../validations/post-validation');
const { jwtAuth } = require ('../auth/jwt');

/*
const { CommentModel } = require ('../models/comment');
const { validatePostID } = require ('../validations/post-validation');
const { writeValidation, validateCommentID } = require ('../validations/comment-validation');

function verifyCommentAuthor (req, res, next) {
	if (req.comment.author.id != req.user.id)
		return res.status (401).send ({message: "Signed in user is not the comment author"});

	next ();
}
*/

router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		res.send (await LikeModel.create ({ post: req.post, backer: req.user }));
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

/*
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
*/

module.exports = router;

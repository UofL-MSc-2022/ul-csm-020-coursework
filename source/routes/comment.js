const express = require ('express');

const router = express.Router ();

const { validatePostID } = require ('../validations/post-validation');
const { writeValidation } = require ('../validations/comment-validation');
const { jwtAuth } = require ('../auth/jwt');

/*
const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { createValidation, updateValidation } = require ('../validations/post-validation');
const { jwtAuth } = require ('../auth/jwt');
*/

function verifyNotPostOwner (req, res, next) {
	if (req.post.owner.id == req.user.id)
		return res.status (401).send ({message: "Signed in user is the post owner"});

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

/*
router.get ('/read/:post_id', jwtAuth, validatePostID, (req, res) => {
	try {
		res.send (req.post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.patch ('/update/:post_id', jwtAuth, validatePostID, verifyPostOwner, async (req, res) => {
	try {
		const {error} = updateValidation (req.body);

		if (error)
			return res.status (400).send ({message: error ['details'] [0] ['message']});

		await req.post.updateOne (req.body);
		req.post = await PostModel.findById (req.post.id);

		res.send (req.post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.delete ('/delete/:post_id', jwtAuth, validatePostID, verifyPostOwner, async (req, res) => {
	try {
		res.send (await PostModel.deleteOne ({_id: req.post.id}));
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});
*/

module.exports = router;

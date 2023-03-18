const express = require ('express');

const router = express.Router ();

const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { createValidation, updateValidation } = require ('../validations/post-validation');
const { jwtAuth } = require ('../auth/jwt');

async function validatePostID (req, res, next) {
	try {
		req.post = await PostModel.findById (req.params.post_id).populate ({path: 'owner', model: UserModel});

		if (! req.post)
			return res.status (400).send ({message: "No post with id " + req.params.post_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

function verifyPostOwner (req, res, next) {
	if (req.post.owner.id != req.user.id)
		return res.status (401).send ({message: "Signed in user is not the post owner"});

	next ();
}

router.post ('/create', jwtAuth, async (req, res) => {
	try {
		const {error} = createValidation (req.body);

		if (error)
			return res.status (400).send ({message: error ['details'] [0] ['message']});

		new_post = await PostModel.create ({
			title: req.body.title,
			body: req.body.body,
			owner: req.user
		});

		res.send (new_post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

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

module.exports = router;

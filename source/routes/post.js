const express = require ('express');

const router = express.Router ();

const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { createValidation, updateValidation } = require ('../validations/post-validation');
const { jwtAuth } = require ('../auth/jwt');

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

router.get ('/read/:post_id', jwtAuth, validatePostID, (req, res) => {
	try {
		res.send (req.post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.patch ('/update/:post_id', jwtAuth, validatePostID, (req, res) => {
	try {
		if (req.post.owner.id != req.user.id)
			return res.status (401).send ({message: "Signed in user is not the post owner"});

		const {error} = updateValidation (req.body);

		if (error)
			return res.status (400).send ({message: error ['details'] [0] ['message']});

		res.send (req.post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

module.exports = router;

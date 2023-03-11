const express = require ('express');

const router = express.Router ();

const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');
const { createValidation } = require ('../validations/post-validation');

router.post ('/create', async (req, res) => {
	user = await UserModel.findOne ();

	try {
		const {error} = createValidation (req.body);

		if (error)
			return res.status (400).send ({message: error ['details'] [0] ['message']});

		new_post = await PostModel.create ({
			title: req.body.title,
			body: req.body.body,
			owner: user
		});

		res.send (new_post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.get ('/read/:post_id', async (req, res) => {
	try {
		post = await PostModel.findById (req.params.post_id);

		if (! post)
			return res.status (400).send ({message: "No post with id " + req.params.post_id});

		res.send (post);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

module.exports = router;

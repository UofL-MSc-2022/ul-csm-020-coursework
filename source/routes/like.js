const express = require ('express');

// Models
const {LikeModel} = require ('../models/like');
const {PostModel} = require ('../models/post');
const {UserModel} = require ('../models/user');

// Middleware
const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyNotPostOwner} = require ('../middleware/post');
const {validateLikeID, verifyLikeBacker} = require ('../middleware/like');

const router = express.Router ();

router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		const newLike = await LikeModel.create ({
			post: req.post,
			backer: req.user
		});

		res.send (newLike);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.delete ('/delete/:like_id', jwtAuth, validateLikeID, verifyLikeBacker, async (req, res) => {
	try {
		// The deleteOne function returns a summary of the delete action,
		// return this to the end user.  The raw id field, _id, must be used
		// explicitly.
		const summary = await LikeModel.deleteOne ({_id: req.like.id});

		res.send (summary);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

router.get ('/list/:scope(all|user)', jwtAuth, async (req, res) => {
	try {
		// If scope == 'all', use an empty filter, otherwise filter like owner
		// by authorised user.
		let filter = {};
		if (req.params.scope == 'user')
			filter = {backer: req.user};

		const likes = await LikeModel.find (filter)
			.sort ({createdAt: 'ascending'})
			.populate ([
				{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
				{path: 'backer', model: UserModel}
			]);

		res.send (likes);
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

module.exports = router;

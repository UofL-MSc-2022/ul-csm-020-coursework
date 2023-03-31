const express = require ('express');

const router = express.Router ();

const { LikeModel } = require ('../models/like');
const { PostModel } = require ('../models/post');
const { UserModel } = require ('../models/user');

const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyNotPostOwner} = require ('../middleware/post');
const {validateLikeID, verifyLikeBacker} = require ('../middleware/like');

router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		res.send (await LikeModel.create ({ post: req.post, backer: req.user }));
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.delete ('/delete/:like_id', jwtAuth, validateLikeID, verifyLikeBacker, async (req, res) => {
	try {
		res.send (await LikeModel.deleteOne ({_id: req.like.id}));
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

router.get ('/list/:scope(all|user)', jwtAuth, async (req, res) => {
	try {
		var filter = {};
		if (req.params.scope == 'user')
			filter = {backer: req.user.id};

		const likes = await LikeModel.find (filter)
			.sort ({createdAt: 1})
			.populate (
				[
					{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
					{path: 'backer', model: UserModel} ]);

		res.send (likes);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

module.exports = router;

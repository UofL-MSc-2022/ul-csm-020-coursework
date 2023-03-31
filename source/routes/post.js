const express = require ('express');

const router = express.Router ();

const {UserModel} = require ('../models/user');
const {PostModel} = require ('../models/post');
const {CommentModel} = require ('../models/comment');
const {LikeModel} = require ('../models/like');
const {createValidation, updateValidation} = require ('../validations/post-validation');
const {jwtAuth} = require ('../middleware/auth');
const {validatePostID, verifyPostOwner} = require ('../middleware/post');

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

router.get ('/read/:post_id', jwtAuth, validatePostID, async (req, res) => {
	try {
		req.post.comments = await CommentModel.find ({post: req.post});
		req.post.likes = await LikeModel.find ({post: req.post});
		req.post.n_likes = req.post.likes.length;

		await req.post.populate ([
			{path: 'owner', model: UserModel},
			{
				path: 'comments',
				model: CommentModel,
				populate: {path: 'author', model: UserModel},
				options: {sort: {createdAt: 1}} },
			{
				path: 'likes',
				model: LikeModel,
				populate: {path: 'backer', model: UserModel},
				options: {sort: {createdAt: 1}} } ]);

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

router.get ('/list/:scope(all|user)', jwtAuth, async (req, res) => {
	try {
		var filter = {};
		if (req.params.scope == 'user')
			filter = {owner: req.user._id};

		const posts = await PostModel.aggregate ([
			{$match: filter},
			{$lookup: {from: 'likes', localField: '_id', foreignField: 'post', as: 'likes'}},
			{$set: { n_likes: {$size: '$likes'}}},
			{$unset: 'likes'},
			{$sort: {n_likes: -1, createdAt: 1}}
		]);

		if (req.params.scope != 'user')
			await PostModel.populate (posts, {path: 'owner', model: UserModel});

		res.send (posts);
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
});

module.exports = router;

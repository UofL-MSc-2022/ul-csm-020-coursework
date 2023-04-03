/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * CRUD logic for likes.
 */

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

// The :post_id parameter is required for validatePostID and verifyNotPostOwner
router.post ('/create/:post_id', jwtAuth, validatePostID, verifyNotPostOwner, async (req, res) => {
	try {
		let newLike = await LikeModel.create ({
			post: req.post,
			backer: req.user
		});

		// Hide the backer field, that is the owner id, from the response.  In
		// order to remove the property, the Mongoose document, CommentModel,
		// must be converted to a JSON object.
		newLike = newLike.toJSON ();
		delete newLike.backer;

		res.send (newLike);
	}
	catch (error) {
		// Error code 11000 is a uniqueness constraint violation.  The error
		// object may not contain a code parameter, in which error.code will be
		// undefined.  This is fine because undefined != 11000 and the else
		// condition will be triggered.
		if (error.code == 11000)
			message = "User has already liked post";
		else
			message = error;

		res.status (400).send ({message: message});
	}
});

// The :like_id parameter is required for validateLikeID and verifyLikeBacker
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

		const likesQuery = LikeModel.find (filter)
			.sort ({createdAt: 'ascending'})
			.populate ([
				{path: 'post', model: PostModel, populate: {path: 'owner', model: UserModel}},
				{path: 'backer', model: UserModel}
			]);

		// When a user requests only their comments, the backer field is
		// skipped.
		if (req.params.scope == 'user')
			likesQuery.select ('-backer');

		res.send (await likesQuery.exec ());
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
});

module.exports = router;

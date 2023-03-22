const { LikeModel } = require ('../models/like');
const { UserModel } = require ('../models/user');
const { PostModel } = require ('../models/post');

async function validateLikeID (req, res, next) {
	try {
		req.like = await LikeModel.findById (req.params.like_id);

		if (! req.like)
			return res.status (400).send ({message: "No like with id " + req.params.like_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

module.exports.validateLikeID = validateLikeID;

const {LikeModel} = require ('../models/like');

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

function verifyLikeBacker (req, res, next) {
	if (req.like.backer.toString () != req.user.id)
		return res.status (400).send ({message: "Signed in user is not the like backer"});

	next ();
}

module.exports.validateLikeID = validateLikeID;
module.exports.verifyLikeBacker = verifyLikeBacker;

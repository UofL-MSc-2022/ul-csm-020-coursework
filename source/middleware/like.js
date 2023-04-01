const {LikeModel} = require ('../models/like');

// Verifies that an endpoint with a like_id parameter corresponds to a like
// found in the database.  If the like exists, it is added to the request
// object and passes control down the middleware chain.  If the like isn't
// found, a 400 error is returned.
async function validateLikeID (req, res, next) {
	try {
		req.like = await LikeModel.findById (req.params.like_id);

		if (! req.like)
			return res.status (400).send ({message: "No like with id " + req.params.like_id});

		next ();
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
}

// A user cannot delete another user's like.  This verifies that the user in
// the request object is the backer of the like in the request object.  A 400
// error is returned if that is not the case.  *Note* This middleware function
// must be called after jwtAuth and validateLikeID
function verifyLikeBacker (req, res, next) {
	if (req.like.backer.toString () != req.user.id)
		return res.status (400).send ({message: "Signed in user is not the like backer"});

	next ();
}

module.exports.validateLikeID = validateLikeID;
module.exports.verifyLikeBacker = verifyLikeBacker;

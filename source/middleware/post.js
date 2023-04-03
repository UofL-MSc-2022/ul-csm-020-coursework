/**
 * MiniWall ReST API
 * CSM020 Jan-Apr 2023
 * James Krehl
 *
 * Express pipeline functions to inject the queried post object into the router
 * request object and restrict CRUD operations to the correct users.
 */

const {PostModel} = require ('../models/post');

// Verifies that an endpoint with a post_id parameter corresponds to a post
// found in the database.  If the post exists, it is added to the request
// object and passes control down the middleware chain.  If the post isn't
// found, a 400 error is returned.
async function validatePostID (req, res, next) {
	try {
		req.post = await PostModel.findById (req.params.post_id);

		if (! req.post)
			return res.status (400).send ({message: "No post with id " + req.params.post_id});

		next ();
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
}

// Certain endpoints require that the authorized user be the owner of a post.
// For example, a user cannot delete another user's post.  This verifies that
// the post in the request object is owned by the user in the request object.
// A 400 error is returned if that is not the case.  *Note* This middleware
// function must be called after jwtAuth and validatePostID.
function verifyPostOwner (req, res, next) {
	if (req.post.owner.toString () != req.user.id)
		return res.status (400).send ({message: "Signed in user is not the post owner"});

	next ();
}

// Certain endpoints require that the authorized user not be the owner of a
// post.  For example, a user cannot like their own post.  This verifies that
// the post in the request object is not owned by the user in the request
// object.  A 400 error is returned if that is not the case.  *Note* This
// middleware function must be called after jwtAuth and validatePostID.
function verifyNotPostOwner (req, res, next) {
	if (req.post.owner.toString () == req.user.id)
		return res.status (400).send ({message: "Signed in user is the post owner"});

	next ();
}

module.exports.validatePostID = validatePostID;
module.exports.verifyPostOwner = verifyPostOwner;
module.exports.verifyNotPostOwner = verifyNotPostOwner;

const {CommentModel} = require ('../models/comment');

// Verifies that an endpoint with a comment_id parameter corresponds to a
// comment found in the database.  If the comment exists, it is added to the
// request object and passes control down the middleware chain.  If the comment
// isn't found, a 400 error is returned.
async function validateCommentID (req, res, next) {
	try {
		req.comment = await CommentModel.findById (req.params.comment_id);

		if (! req.comment)
			return res.status (400).send ({message: "No comment with id " + req.params.comment_id});

		next ();
	}
	catch (error) {
		res.status (400).send ({message: error});
	}
}

// Certain endpoints require that the authorized user be the author of a
// comment.  For example, a user cannot delete another user's comment.  This
// verifies that the comment in the request object is authored by the user in
// the request object.  A 400 error is returned if that is not the case.
// *Note* This middleware function must be called after jwtAuth and
// validateCommentID
function verifyCommentAuthor (req, res, next) {
	if (req.comment.author.toString () != req.user.id)
		return res.status (400).send ({message: "Signed in user is not the comment author"});

	next ();
}

module.exports.validateCommentID = validateCommentID;
module.exports.verifyCommentAuthor = verifyCommentAuthor;

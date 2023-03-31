const {CommentModel} = require ('../models/comment');

async function validateCommentID (req, res, next) {
	try {
		req.comment = await CommentModel.findById (req.params.comment_id);

		if (! req.comment)
			return res.status (400).send ({message: "No comment with id " + req.params.comment_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

function verifyCommentAuthor (req, res, next) {
	if (req.comment.author.toString () != req.user.id)
		return res.status (400).send ({message: "Signed in user is not the comment author"});

	next ();
}

module.exports.validateCommentID = validateCommentID;
module.exports.verifyCommentAuthor = verifyCommentAuthor;

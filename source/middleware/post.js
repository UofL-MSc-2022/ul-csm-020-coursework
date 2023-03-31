const {PostModel} = require ('../models/post');

async function validatePostID (req, res, next) {
	try {
		req.post = await PostModel.findById (req.params.post_id);

		if (! req.post)
			return res.status (400).send ({message: "No post with id " + req.params.post_id});

		next ();
	}
	catch (err) {
		res.status (400).send ({ message: err });
	}
}

function verifyPostOwner (req, res, next) {
	if (req.post.owner.toString () != req.user.id)
		return res.status (400).send ({message: "Signed in user is not the post owner"});

	next ();
}

function verifyNotPostOwner (req, res, next) {
	if (req.post.owner.toString () == req.user.id)
		return res.status (400).send ({message: "Signed in user is the post owner"});

	next ();
}

module.exports.validatePostID = validatePostID;
module.exports.verifyPostOwner = verifyPostOwner;
module.exports.verifyNotPostOwner = verifyNotPostOwner;

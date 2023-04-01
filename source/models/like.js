const mongoose = require ('mongoose');
const joi = require ('joi');

// Create the schema for Comment objects.  Setting the timestamps option allows
// Mongoose to manage createdAt and updatedAt times automatically.  However,
// updates are not applicable to Like objects.  The only valid change to a like
// is deletion.  Therefore, specify that only the createdAt time should be
// maintained.
const likeSchema = mongoose.Schema ({
	post: {type: mongoose.Schema.Types.ObjectId, ref: 'PostModel', required: true},
	backer: {type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true}
}, {timestamps: {createdAt: true, updatedAt: false}});

module.exports.LikeModel = mongoose.model ('likes', likeSchema);

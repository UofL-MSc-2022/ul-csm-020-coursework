const mongoose = require ('mongoose');
const joi = require ('joi');

const likeSchema = mongoose.Schema ({
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'PostModel', required: true },
	backer: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
	date: { type: Date, default: Date.now }
});

module.exports.LikeModel = mongoose.model ('likes', likeSchema);

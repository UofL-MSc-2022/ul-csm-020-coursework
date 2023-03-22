const mongoose = require ('mongoose');
const joi = require ('joi');

const likeSchema = mongoose.Schema ({
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'PostModel', required: true },
	backer: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true }
}, {timestamps: {createdAt: true, updatedAt: false}});

module.exports.LikeModel = mongoose.model ('likes', likeSchema);

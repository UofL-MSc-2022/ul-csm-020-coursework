const mongoose = require ('mongoose');
const config = require ('config');
require ('dotenv/config');

const VerboseReporter = require ('./verbose-reporter');
const { UserModel, createUser } = require ('../../source/models/user');
const { PostModel } = require ('../../source/models/post');
const { CommentModel } = require ('../../source/models/comment');
const { createAccessToken } = require ('../../source/auth/jwt');

const TEST_APP_BASE_URL = "http://localhost:3000"

function initTestSuite () {
	if (config.get ('verbose_testing'))
		jasmine.getEnv ().addReporter (VerboseReporter);
}

function connectToTestDB () {
	mongoose.set ('strictQuery', true);
	mongoose.connect (process.env.TEST_DB_URL, () => {
		if (config.get ('verbose_testing'))
			console.log ('MongoDB test db connected ...');
	});
}

function maxValidLength (fields, key) {
	return fields [key]._rules.filter (r => r.name == 'max') [0].args.limit;
}

async function deleteTestUsers () {
	delete_response = await UserModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("users collection cleared, " + delete_response.deletedCount + " removed");
}

async function createTestUsers () {
	const test_user_params = [
		{
			screen_name: "Olga",
			email: "olga@miniwall.com",
			password: "olgapass" },
		{
			screen_name: "Nick",
			email: "nick@miniwall.com",
			password: "nickpass" },
		{
			screen_name: "Mary",
			email: "mary@miniwall.com",
			password: "marypass" } ];

	var test_users = [];
	for (const params of test_user_params) {
		test_user = await createUser (params.screen_name, params.email, params.password);
		test_user.password_plain = params.password;
		test_users.push (test_user);
	}

	return test_users;
}

async function reloadTestUsers () {
	await deleteTestUsers ();
	return await createTestUsers ();
}

function createTokenHeader (user_id) {
	return {Authorization: 'Bearer ' + createAccessToken (user_id)}
}

async function deleteTestPosts () {
	delete_response = await PostModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("posts collection cleared, " + delete_response.deletedCount + " removed");
}

async function createTestPosts () {
	const test_post_params = [
		{
			title: "Immigrant Song",
			body: "I come from the land of the ice and snow." },
		{
			title: "Rebel Girl",
			body: "That girl thinks she's the queen of the neighborhood." },
		{
			title: "Teenage Riot",
			body: "Everybody's talking about the stormy weather." },
		{
			title: "Destination Venus",
			body: "Twenty million miles of bleakness." },
		{
			title: "California Soul",
			body: "Like a sound you hear that lingers in your ear." },
		{
			title: "The Revolution Will Not Be Televised",
			body: "You will not be able to plug in, turn on and cop out." } ];

	const test_users = await UserModel.find ();

	var test_posts = [];
	var i = 0;
	for (const user of test_users) {
		for (var j = 0; j < 2; j++) {
			params = {
				title: test_post_params [i + j].title,
				body: test_post_params [i + j].body,
				owner: user };

			test_posts.push (await PostModel.create (params));
		}

		i += j;
	}

	return test_posts;
}

async function reloadTestPosts () {
	await deleteTestPosts ();
	return await createTestPosts ();
}

async function deleteTestComments () {
	delete_response = await CommentModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("comments collection cleared, " + delete_response.deletedCount + " removed");
}

async function createTestComments () {
	const test_comment_bodies = [
		"In these deep solitudes and awful cells,",
		"Where heav'nly-pensive contemplation dwells,",
		"And ever-musing melancholy reigns;",
		"What means this tumult in a vestal's veins?",
		"Why rove my thoughts beyond this last retreat?",
		"Why feels my heart its long-forgotten heat?",
		"Yet, yet I love!—From Abelard it came,",
		"And Eloisa yet must kiss the name.",
		"Dear fatal name! rest ever unreveal'd,",
		"Nor pass these lips in holy silence seal'd.",
		"Hide it, my heart, within that close disguise,",
		"Where mix'd with God's, his lov'd idea lies:",
		"O write it not, my hand—the name appears",
		"Already written—wash it out, my tears!",
		"In vain lost Eloisa weeps and prays,",
		"Her heart still dictates, and her hand obeys.",
		"Relentless walls! whose darksome round contains",
		"Repentant sighs, and voluntary pains:",
		"Ye rugged rocks! which holy knees have worn;",
		"Ye grots and caverns shagg'd with horrid thorn!",
		"Shrines! where their vigils pale-ey'd virgins keep,",
		"And pitying saints, whose statues learn to weep!",
		"Though cold like you, unmov'd, and silent grown,",
		"I have not yet forgot myself to stone." ];

	const test_users = await UserModel.find ();
	const test_posts = await PostModel.find ().populate ({path: 'owner', model: UserModel});

	var test_comments = [];
	var i = 0;
	for (const post of test_posts) {
		for (const user of test_users) {
			if (user.id == post.owner.id)
				continue;

			for (var j = 0; j < 2; j++) {
				params = {
					post: post,
					body: test_comment_bodies [i + j],
					author: user };

				test_comments.push (await CommentModel.create (params));
			}

			i += j;
		}
	}

	await CommentModel.populate (test_comments, {path: 'author', model: UserModel});

	return test_comments;
}

async function reloadTestComments () {
	await deleteTestComments ();
	return await createTestComments ();
}

module.exports.TEST_APP_BASE_URL = TEST_APP_BASE_URL
module.exports.initTestSuite = initTestSuite
module.exports.connectToTestDB = connectToTestDB
module.exports.maxValidLength = maxValidLength
module.exports.deleteTestUsers = deleteTestUsers
module.exports.createTestUsers = createTestUsers
module.exports.reloadTestUsers = reloadTestUsers
module.exports.createTokenHeader = createTokenHeader
module.exports.deleteTestPosts = deleteTestPosts
module.exports.createTestPosts = createTestPosts
module.exports.reloadTestPosts = reloadTestPosts
module.exports.deleteTestComments = deleteTestComments
module.exports.createTestComments = createTestComments
module.exports.reloadTestComments = reloadTestComments

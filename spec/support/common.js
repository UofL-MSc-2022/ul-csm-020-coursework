const mongoose = require ('mongoose');
const config = require ('config');
require ('dotenv/config');

const VerboseReporter = require ('./verbose-reporter');
const { UserModel, createUser } = require ('../../source/models/user');
const { PostModel } = require ('../../source/models/post');
const { CommentModel } = require ('../../source/models/comment');
const { LikeModel } = require ('../../source/models/like');
const { createAccessToken } = require ('../../source/auth/jwt');

const TEST_APP_BASE_URL = "http://localhost:3000"

const sample_test_data = {
	users: [
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
			password: "marypass" } ],

	posts: [
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
			body: "You will not be able to plug in, turn on and cop out." } ],

	comments: [
		{body: "In these deep solitudes and awful cells,"},
		{body: "Where heav'nly-pensive contemplation dwells,"},
		{body: "And ever-musing melancholy reigns;"},
		{body: "What means this tumult in a vestal's veins?"},
		{body: "Why rove my thoughts beyond this last retreat?"},
		{body: "Why feels my heart its long-forgotten heat?"},
		{body: "Yet, yet I love!—From Abelard it came,"},
		{body: "And Eloisa yet must kiss the name."},
		{body: "Dear fatal name! rest ever unreveal'd,"},
		{body: "Nor pass these lips in holy silence seal'd."},
		{body: "Hide it, my heart, within that close disguise,"},
		{body: "Where mix'd with God's, his lov'd idea lies:"},
		{body: "O write it not, my hand—the name appears"},
		{body: "Already written—wash it out, my tears!"},
		{body: "In vain lost Eloisa weeps and prays,"},
		{body: "Her heart still dictates, and her hand obeys."},
		{body: "Relentless walls! whose darksome round contains"},
		{body: "Repentant sighs, and voluntary pains:"},
		{body: "Ye rugged rocks! which holy knees have worn;"},
		{body: "Ye grots and caverns shagg'd with horrid thorn!"},
		{body: "Shrines! where their vigils pale-ey'd virgins keep,"},
		{body: "And pitying saints, whose statues learn to weep!"},
		{body: "Though cold like you, unmov'd, and silent grown,"},
		{body: "I have not yet forgot myself to stone."} ] };

function initTestSuite () {
	jasmine_env = jasmine.getEnv ();

	if (! jasmine_env.hasOwnProperty ('verbose_reporter_added'))
		jasmine_env.verbose_reporter_added = false;

	if (config.get ('verbose_testing') && ! jasmine_env.verbose_reporter_added) {
		jasmine_env.addReporter (VerboseReporter);
		jasmine_env.verbose_reporter_added = true;
	}

	jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
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
	var test_users = [];
	for (const params of sample_test_data.users) {
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
	const test_users = await UserModel.find ();

	var test_posts = [];
	var i = 0;
	for (const user of test_users) {
		for (var j = 0; j < 2; j++) {
			params = {
				title: sample_test_data.posts [i + j].title,
				body: sample_test_data.posts [i + j].body,
				owner: user };

			test_posts.push (await PostModel.create (params));
		}

		i += j;
	}

	await PostModel.populate (test_posts, {path: 'owner', model: UserModel});

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
					body: sample_test_data.comments [i + j].body,
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

async function deleteTestLikes () {
	delete_response = await LikeModel.deleteMany ();

	if (config.get ('verbose_testing'))
		console.log ("likes collection cleared, " + delete_response.deletedCount + " removed");
}

async function createTestLikes () {
	const test_users = await UserModel.find ();
	const test_posts = await PostModel.find ().populate ({path: 'owner', model: UserModel});

	var test_likes = [];
	for (const post of test_posts) {
		for (const user of test_users) {
			if (user.id == post.owner.id)
				continue;

			test_likes.push (await LikeModel.create ({post: post, backer: user}));
		}
	}

	await LikeModel.populate (test_likes, {path: 'backer', model: UserModel});

	return test_likes;
}

async function reloadTestLikes () {
	await deleteTestLikes ();
	return await createTestLikes ();
}

async function loadRandomPostsAndLikes (min_posts, min_likes) {
	const test_users = await UserModel.find ();
	await deleteTestLikes ();
	await deleteTestPosts ();

	var n_posts = 0;
	var n_likes = 0;

	var likeable_posts = {};
	for (user of test_users)
		likeable_posts [user.id] = [];

	function choose (set) {
		return set [Math.floor (Math.random () * set.length)];
	}

	while (n_posts < min_posts || n_likes < min_likes) {
		const post_user = choose (test_users);
		const post_data = choose (sample_test_data.posts);
		const post_params = { title: post_data.title, body: post_data.body, owner: post_user };
		const post = await PostModel.create (post_params);

		for (user of test_users) {
			if (user.id == post_user.id)
				continue;

			likeable_posts [user.id].push (post);
		}

		n_posts++;

		for (i=0; i<3; i++) {
			const like_user = choose (test_users);
			const like_post = choose (likeable_posts [like_user.id]);

			if (! like_post)
				continue;

			if (like_user.id == like_post.owner.toString ())
				throw "Can't like own post";

			const like_params = { post: like_post, backer: like_user };
			await LikeModel.create (like_params);

			n_likes++;
		}
	}
}

function ascendingCreationTimesMatcher (matchersUtil) {
	return {
		compare: function (object_array, _) {
			var result = {pass: true};

			var t_0 = new Date (object_array [0].createdAt);
			for (var i = 1; i < object_array.length; i++) {
				var t_1 = new Date (object_array [i].createdAt);

				if (t_1 < t_0) {
					result.pass = false;
					break;
				}

				t_0 = t_1;
			}

			if (result.pass)
				result.message = "Dates are ascending";
			else
				result.message = "Dates are not ascending";

			return result;
		}
	};
}

function postOrderMatcher (matchersUtil) {
	return {
		compare: function (object_array, _) {
			var result = {pass: true, message: "Posts are ordered"};

			var n_0 = object_array [0].n_likes;
			var t_0 = new Date (object_array [0].createdAt);
			for (var i = 1; i < object_array.length; i++) {
				var n_1 = object_array [i].n_likes;
				var t_1 = new Date (object_array [i].createdAt);

				if (n_1 > n_0) {
					result.pass = false;
					result.message = "Likes are not descending";
					break;
				}
				else if (n_1 == n_0 && t_1 < t_0) {
					result.pass = false;
					result.message = "Dates are not ascending";
					break;
				}
				else;

				t_0 = t_1;
				n_0 = n_1;
			}

			return result;
		}
	};
}

module.exports.TEST_APP_BASE_URL = TEST_APP_BASE_URL;
module.exports.initTestSuite = initTestSuite;
module.exports.connectToTestDB = connectToTestDB;
module.exports.maxValidLength = maxValidLength;
module.exports.deleteTestUsers = deleteTestUsers;
module.exports.createTestUsers = createTestUsers;
module.exports.reloadTestUsers = reloadTestUsers;
module.exports.createTokenHeader = createTokenHeader;
module.exports.deleteTestPosts = deleteTestPosts;
module.exports.createTestPosts = createTestPosts;
module.exports.reloadTestPosts = reloadTestPosts;
module.exports.deleteTestComments = deleteTestComments;
module.exports.createTestComments = createTestComments;
module.exports.reloadTestComments = reloadTestComments;
module.exports.deleteTestLikes = deleteTestLikes;
module.exports.createTestLikes = createTestLikes;
module.exports.reloadTestLikes = reloadTestLikes;
module.exports.loadRandomPostsAndLikes = loadRandomPostsAndLikes;
module.exports.ascendingCreationTimesMatcher = ascendingCreationTimesMatcher;
module.exports.postOrderMatcher = postOrderMatcher;

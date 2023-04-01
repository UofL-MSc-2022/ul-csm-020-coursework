const mongoose = require ('mongoose');
const config = require ('config');
require ('dotenv/config');

const VerboseReporter = require ('./verbose-reporter');

// Models
const {UserModel, createUser} = require ('../../source/models/user');
const {PostModel} = require ('../../source/models/post');
const {CommentModel} = require ('../../source/models/comment');
const {LikeModel} = require ('../../source/models/like');

// JWT utility
const {createAccessToken} = require ('../../source/auth/jwt');

const TEST_APP_BASE_URL = "http://" + process.env.APP_HOST + ":" + process.env.APP_PORT;

const sample_test_data = {
	users: [
		{screen_name: "Olga", email: "olga@miniwall.com", password: "olgapass"},
		{screen_name: "Nick", email: "nick@miniwall.com", password: "nickpass"},
		{screen_name: "Mary", email: "mary@miniwall.com", password: "marypass"}
	],

	posts: [
		{
			title: "Immigrant Song",
			body: "I come from the land of the ice and snow."
		},
		{
			title: "Rebel Girl",
			body: "That girl thinks she's the queen of the neighborhood."
		},
		{
			title: "Teenage Riot",
			body: "Everybody's talking about the stormy weather."
		},
		{
			title: "Destination Venus",
			body: "Twenty million miles of bleakness."
		},
		{
			title: "California Soul",
			body: "Like a sound you hear that lingers in your ear."
		},
		{
			title: "The Revolution Will Not Be Televised",
			body: "You will not be able to plug in, turn on and cop out."
		}
	],

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
		{body: "I have not yet forgot myself to stone."}
	]
};

// Initialize test features needed for every suite.
function initTestSuite () {
	jasmine_env = jasmine.getEnv ();

	// The default test output shows a single '.' for every spec run.  To
	// verify that every expect() function has been run, a custom test reporter
	// is used to give a summary of the expect() invocations per spec.  It is
	// possible to add duplicate reporters and initTestSuite() is called by
	// every spec file, therefore set a property on the Jasmine environment
	// object to prevent duplication.
	if (! ('verbose_reporter_added' in jasmine_env))
		jasmine_env.verbose_reporter_added = false;

	// Only add the VerboseReporter if configured, and if it hasn't already
	// been added.
	if (config.get ('verbose_testing') && ! jasmine_env.verbose_reporter_added) {
		jasmine_env.addReporter (VerboseReporter);
		jasmine_env.verbose_reporter_added = true;
	}

	// The default timeout for every spec is 5000ms.  However, some specs in
	// this suite make close to 100 HTTP requests of a live deployment which
	// require awaits on database operations.  Therefore, the default timeout
	// is increased to prevent spec aborts.
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
}

// Helper function to initialize Mongoose
function connectToTestDB () {
	mongoose.set ('strictQuery', true);
	mongoose.connect (process.env.DB_URL, () => {
		if (config.get ('verbose_testing'))
			console.log ('MongoDB test db connected ...');
	});
}

// Extracting the max length from a validation schema field is convoluted, this
// helper function streamlines retrieval.
function maxValidLength (fields, key) {
	return fields[key]._rules.filter (r => r.name == 'max')[0].args.limit;
}

// Helper function to generate the auth HTTP request header.
function createTokenHeader (user_id) {
	return {Authorization: 'Bearer ' + createAccessToken (user_id)};
}

// Clear the test database of all existing users.
async function deleteTestUsers () {
	delete_response = await UserModel.deleteMany ();

	// Output a summary of the database clear if verbose_testing is configured.
	if (config.get ('verbose_testing'))
		console.log ("users collection cleared, " + delete_response.deletedCount + " removed");
}

// Load a user fixture and return the list of UserModel objects.
async function createTestUsers () {
	let test_users = [];
	for (const params of sample_test_data.users) {
		test_user = await createUser (params.screen_name, params.email, params.password);
		test_user.password_plain = params.password;
		test_users.push (test_user);
	}

	return test_users;
}

// Clear the users collection and load the users fixture.
async function reloadTestUsers () {
	await deleteTestUsers ();
	return await createTestUsers ();
}

// Clear the test database of all existing posts.
async function deleteTestPosts () {
	delete_response = await PostModel.deleteMany ();

	// Output a summary of the database clear if verbose_testing is configured.
	if (config.get ('verbose_testing'))
		console.log ("posts collection cleared, " + delete_response.deletedCount + " removed");
}

// Load a post fixture and return the list of PostModel objects.  The user
// fixture must already be loaded.
async function createTestPosts () {
	// Retrieve loaded users.
	const test_users = await UserModel.find ();

	let test_posts = [];
	let i = 0;
	let j = 0;
	for (const user of test_users) {
		// Give each user two posts.
		for (j=0; j<2; j++) {
			params = {
				title: sample_test_data.posts[i + j].title,
				body: sample_test_data.posts[i + j].body,
				owner: user
			};

			test_posts.push (await PostModel.create (params));
		}

		i += j;
	}

	// Hydrate the owner field for each post object.
	await PostModel.populate (test_posts, {path: 'owner', model: UserModel});

	return test_posts;
}

// Clear the posts collection and load the posts fixture.
async function reloadTestPosts () {
	await deleteTestPosts ();
	return await createTestPosts ();
}

// Clear the test database of all existing comments.
async function deleteTestComments () {
	delete_response = await CommentModel.deleteMany ();

	// Output a summary of the database clear if verbose_testing is configured.
	if (config.get ('verbose_testing'))
		console.log ("comments collection cleared, " + delete_response.deletedCount + " removed");
}

// Load a comment fixture and return the list of CommentModel objects.  The
// user and post fixtures must already be loaded.
async function createTestComments () {
	// Retrieve loaded users and posts.
	const test_users = await UserModel.find ();
	const test_posts = await PostModel.find ().populate ({path: 'owner', model: UserModel});

	let test_comments = [];
	let i = 0;
	let j = 0;
	for (const post of test_posts) {
		for (const user of test_users) {
			// Avoid users commenting on posts they own.
			if (user.id == post.owner.id)
				continue;

			// Give each post two comments.
			for (j=0; j<2; j++) {
				params = {
					post: post,
					body: sample_test_data.comments[i + j].body,
					author: user
				};

				test_comments.push (await CommentModel.create (params));
			}

			i += j;
		}
	}

	// Hydrate the author field for each comment object.
	await CommentModel.populate (test_comments, {path: 'author', model: UserModel});

	return test_comments;
}

// Clear the comments collection and load the comments fixture.
async function reloadTestComments () {
	await deleteTestComments ();
	return await createTestComments ();
}

// Clear the test database of all existing likes.
async function deleteTestLikes () {
	delete_response = await LikeModel.deleteMany ();

	// Output a summary of the database clear if verbose_testing is configured.
	if (config.get ('verbose_testing'))
		console.log ("likes collection cleared, " + delete_response.deletedCount + " removed");
}

// Load a like fixture and return the list of LikeModel objects.  The user and
// post fixtures must already be loaded.
async function createTestLikes () {
	const test_users = await UserModel.find ();
	const test_posts = await PostModel.find ().populate ({path: 'owner', model: UserModel});

	// Every user likes every post, except the ones they own.
	let test_likes = [];
	for (const post of test_posts) {
		for (const user of test_users) {
			// Avoid users commenting on posts they own.
			if (user.id == post.owner.id)
				continue;

			test_likes.push (await LikeModel.create ({post: post, backer: user}));
		}
	}

	// Hydrate the backer field for each like object.
	await LikeModel.populate (test_likes, {path: 'backer', model: UserModel});

	return test_likes;
}

// Clear the likes collection and load the likes fixture.
async function reloadTestLikes () {
	await deleteTestLikes ();
	return await createTestLikes ();
}

// Some specs, e.g. specs that verify proper ordering, require test fixtures
// that aren't as uniform as the ones above.  This loads a randomised selection
// of posts and likes.  The number of posts and likes is random, but are
// guaranteed to be greater than or equal to the min_posts and min_likes
// arguments.  The user fixture must already be loaded.
async function loadRandomPostsAndLikes (min_posts, min_likes) {
	const test_users = await UserModel.find ();

	// Clear the database of all existing posts and likes.
	await deleteTestLikes ();
	await deleteTestPosts ();

	let n_posts = 0;
	let n_likes = 0;

	// Initialize an associated array of users to posts that they are eligible
	// to like.
	let likeable_posts = {};
	for (user of test_users)
		likeable_posts[user.id] = [];

	// Lambda function to randomly select an item from a set.
	const choose = (set) => { return set[Math.floor (Math.random () * set.length)]; };

	// Continue through loop until minimum thresholds for both likes and posts
	// has been reached.
	while (n_posts < min_posts || n_likes < min_likes) {
		const post_user = choose (test_users);
		const post_data = choose (sample_test_data.posts);
		const post_params = {title: post_data.title, body: post_data.body, owner: post_user};
		const post = await PostModel.create (post_params);

		for (const user of test_users) {
			if (user.id == post_user.id)
				continue;

			likeable_posts[user.id].push (post);
		}

		n_posts++;

		// Repeat like selection 3 times to have approximately 3 times more
		// likes than posts.
		for (let i=0; i<3; i++) {
			const like_user = choose (test_users);
			const like_post = choose (likeable_posts[like_user.id]);

			// This only happens if the user's likeable_posts array is empty.
			if (! like_post)
				continue;

			// This shouldn't happen, so throw an error to signify a bug in the
			// function.
			if (like_user.id == like_post.owner.toString ())
				throw "Can't like own post";

			const like_params = {post: like_post, backer: like_user};
			await LikeModel.create (like_params);

			n_likes++;
		}
	}
}

// Custom matcher for expect() calls to ensure that an array of objects that
// have a 'createdAt' property are ordered by ascending times.
function ascendingCreationTimesMatcher (matchersUtil) {
	return {
		// Matcher compare function signature takes two arguments, but this
		// matcher only requires one.
		compare: (object_array, _) => {
			let result = {pass: true};

			let t_0 = new Date (object_array[0].createdAt);
			for (let i=1; i<object_array.length; i++) {
				let t_1 = new Date (object_array[i].createdAt);

				if (t_1 < t_0) {
					result.pass = false;
					// Unordered elements found, no need to continue checking.
					break;
				}

				t_0 = t_1;
			}

			// Set matcher message depending on success state.
			if (result.pass)
				result.message = "Dates are ascending";
			else
				result.message = "Dates are not ascending";

			return result;
		}
	};
}

// Custom matcher for expect() calls to ensure that an array of PostModel
// objects have the specified post order.  The primary sort is by descending
// 'n_likes' and ties are broken by ascending 'createdAt' times.
function postOrderMatcher (matchersUtil) {
	return {
		// Matcher compare function signature takes two arguments, but this
		// matcher only requires one.
		compare: (object_array, _) => {
			let result = {pass: true, message: "Posts are ordered"};

			let n_0 = object_array[0].n_likes;
			let t_0 = new Date (object_array[0].createdAt);
			for (let i=1; i<object_array.length; i++) {
				let n_1 = object_array[i].n_likes;
				let t_1 = new Date (object_array[i].createdAt);

				if (n_1 > n_0) {
					result.pass = false;
					result.message = "Likes are not descending";
					// Unordered elements found, no need to continue checking.
					break;
				}
				else if (n_1 == n_0 && t_1 < t_0) {
					result.pass = false;
					result.message = "Dates are not ascending";
					// Unordered elements found, no need to continue checking.
					break;
				}
				// (n_1 <= n_0) and (n_1 != n_0 or t_1 >= t_0), posts are in
				// order so there's nothing to do.
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

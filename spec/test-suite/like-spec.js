const axios = require ("axios");

const common = require ('../support/common');
const { LikeModel } = require ('../../source/models/like');

common.initTestSuite ();

describe ("like test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/like';
	const create_end_point = end_point_base + '/create';
	const delete_end_point = end_point_base + '/delete';
	const list_all_end_point = end_point_base + '/list/all';

	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.test_users = await common.reloadTestUsers ();
		this.test_posts = await common.reloadTestPosts ();
	});

	it ("verify auth required", async function () {
		const end_points = [
			{
				method: 'post',
				url: create_end_point + '/DEADBEEF' } ];

		for (const end_point of end_points)
			await axios ({method: end_point.method, url: end_point.url})
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
	});

	it ("wrong user", async function () {
		// Create test
		for (const post of this.test_posts) {
			const auth_header = {headers: common.createTokenHeader (post.owner)};
			const end_point = create_end_point + '/' + post.id;

			await axios.post (end_point, {}, auth_header)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
		}
	});

	describe ("verify CRUD methods", function () {
		describe ("create tests", function () {
			it ("missing parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

				await axios.post (create_end_point, {}, auth_header)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			it ("invalid parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
				const end_points = [
					create_end_point + '/DEADBEEF', // Malformed ObjectID
					create_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.post (end_point, {}, auth_header)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				for (const post of this.test_posts) {
					const end_point = create_end_point + '/' + post.id;

					for (const user of this.test_users) {
						if (user.id == post.owner.id)
							continue;

						const auth_header = {headers: common.createTokenHeader (user.id)};

						await axios.post (end_point, {}, auth_header)
							.then (function (response) {
								expect (response.status).toBe (200);
								expect (response.data ['post']).toBe (post.id);
								expect (response.data ['backer']).toBe (user.id);
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});
					}
				}
			});
		});

		describe ("delete tests", function () {
			beforeEach (async function () { this.test_likes = await common.reloadTestLikes (); });

			it ("missing parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

				await axios.delete (delete_end_point, auth_header)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			it ("invalid parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
				const end_points = [
					delete_end_point + '/DEADBEEF', // Malformed ObjectID
					delete_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.delete (end_point, auth_header)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				for (const like of this.test_likes) {
					const auth_header = {headers: common.createTokenHeader (like.backer)};
					const end_point = delete_end_point + '/' + like.id;

					await axios.delete (end_point, auth_header)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data.deletedCount).toBe (1);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});
	});

	describe ("list tests", function () {
		beforeEach (async function () { this.test_likes = await common.reloadTestLikes (); });

		it ("list all", async function () {
			const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

			await axios.get (list_all_end_point, auth_header)
				.then (async function (response) {
					expect (response.status).toBe (200);

					const n_expected = await LikeModel.countDocuments ();
					expect (response.data.length).toBe (n_expected);

					var t_0 = new Date (response.data [0].date);

					for (var i = 1; i < response.data.length; i++) {
						var t_1 = new Date (response.data [i].date);

						expect (t_1).toBeGreaterThan (t_0);

						t_0 = t_1;
					}
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});
	});
});

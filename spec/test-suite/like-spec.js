const axios = require ("axios");

const common = require ('../support/common');
const { LikeModel } = require ('../../source/models/like');

common.initTestSuite ();

describe ("like test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/like';
	const create_end_point = end_point_base + '/create';
	const delete_end_point = end_point_base + '/delete';
	const list_end_point = end_point_base + '/list';

	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.test_users = await common.reloadTestUsers ();
		this.test_posts = await common.reloadTestPosts ();
	});

	it ("verify auth required", async function () {
		const end_points = [
			{
				method: 'post',
				url: create_end_point + '/DEADBEEF' },
			{
				method: 'delete',
				url: delete_end_point + '/DEADBEEF' },
			{
				method: 'get',
				url: list_end_point + '/all' },
			{
				method: 'get',
				url: list_end_point + '/user' } ];

		for (const end_point of end_points)
			await axios ({method: end_point.method, url: end_point.url})
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
	});

	it ("wrong user, create", async function () {
		for (const post of this.test_posts) {
			const auth_header = {headers: common.createTokenHeader (post.owner)};
			const end_point = create_end_point + '/' + post.id;

			await axios.post (end_point, {}, auth_header)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	it ("wrong user, delete", async function () {
		const test_likes = await common.reloadTestLikes ();

		for (const like of test_likes) {
			const end_point = delete_end_point + '/' + like.id;

			for (const user of this.test_users) {
				if (like.backer.id == user.id)
					continue;

				const auth_header = {headers: common.createTokenHeader (user.id)};

				await axios.delete (end_point, auth_header)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (400);
					});
			}
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

			it ("duplicate like", async function () {
				await common.deleteTestLikes ();

				for (const post of this.test_posts) {
					const end_point = create_end_point + '/' + post.id;

					for (const user of this.test_users) {
						if (user.id == post.owner.id)
							continue;

						const auth_header = {headers: common.createTokenHeader (user.id)};

						// The first like should be successful.
						await axios.post (end_point, {}, auth_header)
							.then (function (response) {
								expect (response.status).toBe (200);
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});

						// The second like should fail.
						await axios.post (end_point, {}, auth_header)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								console.log (error.response.data);
								expect (error.response.status).toBe (400);
							});
					}
				}
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
		beforeAll (function () {
			jasmine.addMatchers ({ toHaveAscendingCreationTimes: common.ascendingCreationTimesMatcher });
		});

		beforeEach (async function () { this.test_likes = await common.reloadTestLikes (); });

		it ("invalid scope", async function () {
			const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
			const end_point = list_end_point + '/asdf';

			await axios.get (end_point, auth_header)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});

		it ("all scope", async function () {
			const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
			const end_point = list_end_point + '/all';

			await axios.get (end_point, auth_header)
				.then (async function (response) {
					expect (response.status).toBe (200);

					const n_expected = await LikeModel.countDocuments ();
					expect (response.data.length).toBe (n_expected);

					expect (response.data).toHaveAscendingCreationTimes ();
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});

		it ("user scope", async function () {
			const end_point = list_end_point + '/user';

			for (const user of this.test_users) {
				const auth_header = {headers: common.createTokenHeader (user.id)};

				await axios.get (end_point, auth_header)
					.then (async function (response) {
						expect (response.status).toBe (200);

						const n_expected = await LikeModel.countDocuments ({backer: user});
						expect (response.data.length).toBe (n_expected);

						expect (response.data).toHaveAscendingCreationTimes ();
					})
					.catch (function (error) {
						expect (true).toBe (false);
					});
			}
		});
	});
});

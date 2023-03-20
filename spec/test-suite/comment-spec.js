const axios = require ("axios");

const common = require ('../support/common');
const { commentValidationFields } = require ('../../source/models/comment');
const { PostModel } = require ('../../source/models/post');

common.initTestSuite ();

describe ("comment test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/comment';
	const create_end_point = end_point_base + '/create';

	const valid_params = { body: 'body' };

	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.test_users = await common.reloadTestUsers ();
		this.test_posts = await common.reloadTestPosts (this.test_users);

		this.valid_user_post_map = [];
		for (const user of this.test_users)
			this.valid_user_post_map.push ({
				user: user,
				posts: await PostModel.find ({ owner: { $ne: user } })});
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
		for (const post of this.test_posts) {
			const auth_header = common.createTokenHeader (post.owner);
			const requests = [
				{
					method: 'post',
					end_point: create_end_point + '/' + post.id,
					params: valid_params } ];

			for (const req of requests) {
				req_config = {
					method: req.method,
					url: req.end_point,
					data: req.params,
					headers: auth_header};

				await axios (req_config)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (401);
					});
			}
		}
	});

	describe ("verify CRUD methods", function () {
		const min_params = { body: "a" };
		const max_params = {
			body: "a".repeat (common.maxValidLength (commentValidationFields, 'body') + 1) };

		describe ("create tests", function () {
			beforeEach (common.deleteTestComments);

			it ("missing parameters", async function () {
				for (const user_posts of this.valid_user_post_map) {
					const auth_header = {headers: common.createTokenHeader (user_posts.user.id)};

					for (const post of user_posts.posts) {
						const end_point = create_end_point + '/' + post.id;

						await axios.post (end_point, {}, auth_header)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
					}
				}
			});

			it ("invalid parameters", async function () {
				const test_params = [
					{ body: min_params.body },
					{ body: max_params.body } ];

				for (const user_posts of this.valid_user_post_map) {
					const auth_header = {headers: common.createTokenHeader (user_posts.user.id)};

					for (const post of user_posts.posts) {
						const end_point = create_end_point + '/' + post.id;

						for (const params of test_params)
							await axios.post (end_point, params, auth_header)
								.then (function (response) {
									expect (true).toBe (false);
								})
								.catch (function (error) {
									expect (error.response.status).toBe (400);
								});
					}
				}
			});

			it ("valid parameters", async function () {
				for (const user_posts of this.valid_user_post_map) {
					const auth_header = {headers: common.createTokenHeader (user_posts.user.id)};

					for (const post of user_posts.posts) {
						const end_point = create_end_point + '/' + post.id;

						await axios.post (end_point, valid_params, auth_header)
							.then (function (response) {
								expect (response.status).toBe (200);
								expect (response.data ['post']).toBe (post.id);
								expect (response.data ['author']).toBe (user_posts.user.id);
							});
					}
				}
			});
		});
	});
});

			/*
		describe ("read tests", function () {
			beforeEach (async function () { this.test_posts = await common.reloadTestPosts (this.test_users); });

			it ("missing parameters", async function () {
				for (const post of this.test_posts) {
					const req_config = {headers: common.createTokenHeader (this.test_users [0].id)};

					await axios.get (read_end_point, req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (404);
						});
				}
			});

			it ("invalid parameters", async function () {
				const req_config = {headers: common.createTokenHeader (this.test_users [0].id)};
				const end_points = [
					read_end_point + '/DEADBEEF', // Malformed ObjectID
					read_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.get (end_point, req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				for (const post of this.test_posts) {
					const req_config = {headers: common.createTokenHeader (this.test_users [0].id)};
					const end_point = read_end_point + '/' + post.id;

					await axios.get (end_point, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data ['_id']).toBe (post.id);
						});
				}
			});
		});

		describe ("update tests", function () {
			beforeEach (async function () { this.test_posts = await common.reloadTestPosts (this.test_users); });

			it ("wrong user", async function () {
				for (const user of this.test_users) {
					const posts = await PostModel.find ({ owner: { $ne: user } });

					for (const post of posts) {
						const end_point = update_end_point + '/' + post.id;
						const req_config = {headers: common.createTokenHeader (user.id)};

						await axios.patch (end_point, valid_params, req_config)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (401);
							});
					}
				}
			});

			it ("missing parameters", async function () {
				for (const post of this.test_posts) {
					const end_point = update_end_point + '/' + post.id;
					const req_config = {headers: common.createTokenHeader (post.owner)};

					await axios.patch (end_point, {}, req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			});

			/* Note: This spec makes 48 requests (6 test posts, 8 parameter
			 * configurations per post) of the test deployment and requires
			 * longer than the default 5000 ms to complete.
			it ("invalid parameters", async function () {
				const test_params = [
					{ title: min_params.title },
					{ title: max_params.title },
					{ body: min_params.body },
					{ body: max_params.body },
					{ title: min_params.title, body: valid_params.body },
					{ title: max_params.title, body: valid_params.body },
					{ title: valid_params.title, body: min_params.body },
					{ title: valid_params.title, body: max_params.body } ];

				for (const post of this.test_posts) {
					const end_point = update_end_point + '/' + post.id;
					const req_config = {headers: common.createTokenHeader (post.owner)};

					for (params of test_params)
						await axios.patch (end_point, params, req_config)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
				}
			}, 10000 /* Override default jasmine spec timeout);

			/* Note: This spec makes 18 requests (6 test posts, 3 parameter
			 * configurations per post) of the test deployment and requires
			 * longer than the default 5000 ms to complete.
			it ("valid parameters", async function () {
				const test_params = {
					first_title_change: { title: 'first_title_change' },
					first_body_change: { body: 'first_body_change' },
					second_change: { title: 'second_title_change', body: 'second_body_change' } };

				for (const post of this.test_posts) {
					const original_body = post.body;

					const end_point = update_end_point + '/' + post.id;
					const req_config = {headers: common.createTokenHeader (post.owner)};

					// First title change
					await axios.patch (end_point, test_params.first_title_change, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);

							const updated_post = response.data;

							expect (updated_post.title).toBe (test_params.first_title_change.title);
							expect (updated_post.body).toBe (original_body);
						});

					// First body change (title already changed)
					await axios.patch (end_point, test_params.first_body_change, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);

							const updated_post = response.data;

							expect (updated_post.title).toBe (test_params.first_title_change.title);
							expect (updated_post.body).toBe (test_params.first_body_change.body);
						});

					// Second change (both parameters changed)
					await axios.patch (end_point, test_params.second_change, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);

							const updated_post = response.data;

							expect (updated_post.title).toBe (test_params.second_change.title);
							expect (updated_post.body).toBe (test_params.second_change.body);
						});
				}
			}, 10000 /* Override default jasmine spec timeout);
		});

		describe ("delete tests", function () {
			beforeEach (async function () { this.test_posts = await common.reloadTestPosts (this.test_users); });

			it ("wrong user", async function () {
				for (const user of this.test_users) {
					const posts = await PostModel.find ({ owner: { $ne: user } });

					for (const post of posts) {
						const end_point = delete_end_point + '/' + post.id;
						const req_config = {headers: common.createTokenHeader (user.id)};

						await axios.delete (end_point, valid_params, req_config)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (401);
							});
					}
				}
			});

			it ("invalid parameters", async function () {
				const req_config = {headers: common.createTokenHeader (this.test_users [0].id)};
				const end_points = [
					delete_end_point + '/DEADBEEF', // Malformed ObjectID
					delete_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.delete (end_point, req_config)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				for (const post of this.test_posts) {
					const req_config = {headers: common.createTokenHeader (post.owner)};
					const end_point = delete_end_point + '/' + post.id;

					await axios.delete (end_point, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data.deletedCount).toBe (1);
						});
				}
			});
*/
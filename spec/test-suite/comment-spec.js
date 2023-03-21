const axios = require ("axios");

const common = require ('../support/common');
const { commentValidationFields } = require ('../../source/models/comment');
const { PostModel } = require ('../../source/models/post');

common.initTestSuite ();

describe ("comment test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/comment';
	const create_end_point = end_point_base + '/create';
	const read_end_point = end_point_base + '/read';
	const update_end_point = end_point_base + '/update';
	const delete_end_point = end_point_base + '/delete';

	const valid_params = { body: 'body' };

	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.test_users = await common.reloadTestUsers ();
		this.test_posts = await common.reloadTestPosts ();
		this.test_comments = await common.reloadTestComments ();
	});

	it ("verify auth required", async function () {
		const end_points = [
			{
				method: 'post',
				url: create_end_point + '/DEADBEEF' },
			{
				method: 'get',
				url: read_end_point + '/DEADBEEF' },
			{
				method: 'patch',
				url: update_end_point + '/DEADBEEF' },
			{
				method: 'delete',
				url: delete_end_point + '/DEADBEEF' } ];

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

			await axios.post (end_point, valid_params, auth_header)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
		}

		// Update and delete tests
		for (const comment of this.test_comments) {
			const requests = [
				{
					method: 'patch',
					end_point: update_end_point + '/' + comment.id,
					params: valid_params },
				{
					method: 'delete',
					end_point: delete_end_point + '/' + comment.id,
					params: {} } ];

			for (const user of this.test_users) {
				if (user.id == comment.author.id)
					continue;

				const auth_header = common.createTokenHeader (user.id);

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
		}
	});

	describe ("verify CRUD methods", function () {
		const min_params = { body: "a" };
		const max_params = {
			body: "a".repeat (common.maxValidLength (commentValidationFields, 'body') + 1) };

		describe ("create tests", function () {
			beforeEach (common.deleteTestComments);

			it ("missing parameters", async function () {
				for (const post of this.test_posts) {
					const end_point = create_end_point + '/' + post.id;

					for (const user of this.test_users) {
						if (user.id == post.owner.id)
							continue;

						const auth_header = {headers: common.createTokenHeader (user.id)};

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

				for (const post of this.test_posts) {
					const end_point = create_end_point + '/' + post.id;

					for (const user of this.test_users) {
						if (user.id == post.owner.id)
							continue;

						const auth_header = {headers: common.createTokenHeader (user.id)};

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
				for (const post of this.test_posts) {
					const end_point = create_end_point + '/' + post.id;

					for (const user of this.test_users) {
						if (user.id == post.owner.id)
							continue;

						const auth_header = {headers: common.createTokenHeader (user.id)};

						await axios.post (end_point, valid_params, auth_header)
							.then (function (response) {
								expect (response.status).toBe (200);
								expect (response.data ['post']).toBe (post.id);
								expect (response.data ['author']).toBe (user.id);
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});
					}
				}
			});
		});

		describe ("read tests", function () {
			it ("missing parameters", async function () {
				const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};

				await axios.get (read_end_point, auth_header)
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
					read_end_point + '/DEADBEEF', // Malformed ObjectID
					read_end_point + '/12345678DEADBEEF98765432' ]; // Nonexistent ObjectID

				for (end_point of end_points)
					await axios.get (end_point, auth_header)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			it ("valid parameters", async function () {
				test_comments = await common.reloadTestComments ();

				for (const comment of test_comments) {
					const auth_header = {headers: common.createTokenHeader (this.test_users [0].id)};
					const end_point = read_end_point + '/' + comment.id;

					await axios.get (end_point, auth_header)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data ['_id']).toBe (comment.id);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("update tests", function () {
			beforeEach (async function () { this.test_comments = await common.reloadTestComments (); });

			it ("missing parameters", async function () {
				for (const comment of this.test_comments) {
					const end_point = update_end_point + '/' + comment.id;
					const auth_header = {headers: common.createTokenHeader (comment.author.id)};

					await axios.patch (end_point, {}, auth_header)
						.then (function (response) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			});

			it ("invalid parameters", async function () {
				const test_params = [
					{ body: min_params.body },
					{ body: max_params.body } ];

				for (const comment of this.test_comments) {
					const auth_header = {headers: common.createTokenHeader (comment.author.id)};
					const end_point = update_end_point + '/' + comment.id;

					for (const params of test_params)
						await axios.patch (end_point, params, auth_header)
							.then (function (response) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
				}
			});

			it ("valid parameters", async function () {
				for (const comment of this.test_comments) {
					const auth_header = {headers: common.createTokenHeader (comment.author.id)};
					const end_point = update_end_point + '/' + comment.id;

					await axios.patch (end_point, valid_params, auth_header)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data.body).toBe (valid_params.body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("delete tests", function () {
			beforeEach (async function () { this.test_comments = await common.reloadTestComments (); });

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
				for (const comment of this.test_comments) {
					const auth_header = {headers: common.createTokenHeader (comment.author)};
					const end_point = delete_end_point + '/' + comment.id;

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
});

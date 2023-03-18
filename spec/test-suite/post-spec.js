const axios = require ("axios");

const common = require ('../support/common');
const { PostModel, postValidationFields } = require ('../../source/models/post');

common.initTestSuite ();

describe ("post test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/post';
	const create_end_point = end_point_base + '/create';
	const read_end_point = end_point_base + '/read';
	const update_end_point = end_point_base + '/update';

	it ("verify auth required", async function () {
		const end_points = [
			{
				method: 'post',
				url: end_point_base + '/create' },
			{
				method: 'get',
				url: end_point_base + '/read/deadbeef' } ];

		for (const end_point of end_points)
			await axios ({method: end_point.method, url: end_point.url})
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
	});

	describe ("verify CRUD methods", function () {
		beforeAll (common.connectToTestDB);
		beforeEach (async function () { this.test_users = await common.reloadTestUsers (); });

		const min_params = {
			title: "a",
			body: "a" };

		const max_length = (key) =>
			postValidationFields [key]._rules.filter (r => r.name == 'max') [0].args.limit;

		const max_params = {
			title: "a".repeat (max_length ('title') + 1),
			body: "a".repeat (max_length ('body') + 1) };

		const valid_params = {
			title: 'title',
			body: 'body' };

		describe ("create tests", function () {
			beforeEach (common.deleteTestPosts);

			it ("missing parameters", async function () {
				const test_params = [{title: 'title'}, {body: 'body'}];

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user.id)};

					for (const params of test_params)
						await axios.post (create_end_point, params, req_config)
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
					{ title: min_params.title, body: valid_params.body },
					{ title: max_params.title, body: valid_params.body },
					{ title: valid_params.title, body: min_params.body },
					{ title: valid_params.title, body: max_params.body } ];

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user.id)};

					for (const params of test_params) {
						await axios.post (create_end_point, params, req_config)
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
				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user.id)};

					await axios.post (create_end_point, valid_params, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data ['owner']).toBe (user.id);
						});
				}
			});
		});

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
			 */
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
			}, 10000 /* Override default jasmine spec timeout */);

/*
			it ("valid parameters", async function () {
				for (const post of this.test_posts) {
					const req_config = {headers: common.createTokenHeader (this.test_users [0])};
					const end_point = read_end_point + '/' + post.id;

					await axios.get (end_point, req_config)
						.then (function (response) {
							expect (response.status).toBe (200);
							expect (response.data ['_id']).toBe (post.id);
						});
				}
			}); */
		});
	});
});

const axios = require ("axios");

const common = require ('../support/common');
const { postValidationFields } = require ('../../source/models/post');

common.initTestSuite ();

describe ("post test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/post';
	const create_end_point = end_point_base + '/create';
	const read_end_point = end_point_base + '/read';

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

		describe ("create tests", function () {
			beforeEach (common.deleteTestPosts);

			it ("missing parameters", async function () {
				const test_params = [{title: 'title'}, {body: 'body'}];

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user)};

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

				const test_params = [
					{
						title: min_params.title,
						body: valid_params.body },
					{
						title: max_params.title,
						body: valid_params.body },
					{
						title: valid_params.title,
						body: min_params.body },
					{
						title: valid_params.title,
						body: max_params.body } ];

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user)};

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
				const valid_params = {
					title: 'title',
					body: 'body' };

				for (const user of this.test_users) {
					const req_config = {headers: common.createTokenHeader (user)};

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
					const req_config = {headers: common.createTokenHeader (this.test_users [0])};

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
				const req_config = {headers: common.createTokenHeader (this.test_users [0])};
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
							console.log (error.response.data);
						});
			});

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
			});
		});
	});
});

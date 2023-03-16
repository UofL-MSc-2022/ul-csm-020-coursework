const axios = require ("axios");

const common = require ('../support/common');

common.initTestSuite ();

describe ("post test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/post';
	const create_end_point = end_point_base + '/create';

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

		describe ("missing required parameters", function () {
			it ("create test", async function () {
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
		});
	});
});

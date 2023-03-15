const axios = require ("axios");

const common = require ('../support/common');
const { userValidationFields, createUser } = require ('../../source/models/user');
const { verifyAccessToken } = require ('../../source/auth/jwt');

common.initTestSuite ();

describe ("post test suite", function () {
	const end_point_base = common.TEST_APP_BASE_URL + '/api/post';

	describe ("verify auth required", function () {
		const end_points = [
			{
				method: 'post',
				url: end_point_base + '/create' },
			{
				method: 'get',
				url: end_point_base + '/read/deadbeef' } ];

		it ("test each post end point", async function () {
			for (end_point of end_points)
				await axios ({method: end_point.method, url: end_point.url})
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (401);
					});
		});
	});

	describe ("verify CRUD methods", function () {
	});
});

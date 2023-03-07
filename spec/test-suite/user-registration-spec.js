const axios = require ("axios");

const base_url = "http://localhost:3000"

describe ("registration test suite", function () {
	const end_point = base_url + '/api/user/register';

	describe ("GET /api/user/register", function () {
		it ("GET not found", async function () {
			await axios.get (end_point)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});
	});

	describe ("POST /api/user/register", function () {
		const params = {
			screen_name: "test_user",
			email: "test_user@mail.com",
			password: "password" };

		const subsets = [
			["screen_name"], ["email"], ["password"],
			["screen_name", "email"], ["screen_name", "password"], ["email", "password"] ];

		it ("missing required params", async function () {
			for (subset of subsets) {
				param_subset = {};
				for (p of subset)
					param_subset [p] = params [p];

				await axios.post (end_point, param_subset)
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

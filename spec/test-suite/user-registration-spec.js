const axios = require ("axios");

const base_url = "http://localhost:3000"

describe ("registration test", function () {
	describe ("GET /api/user/register", function () {
		it ("returns status 404", function () {
			return axios.get (base_url + '/api/user/register')
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});
	});
});

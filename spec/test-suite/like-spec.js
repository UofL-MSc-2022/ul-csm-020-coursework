const axios = require ("axios");

const common = require ('../support/common');
const {LikeModel} = require ('../../source/models/like');

common.initTestSuite ();

describe ("Like endpoint tests:", function () {
	const endpointBase = common.BASE_URL + '/api/like';
	const createEndpoint = endpointBase + '/create';
	const deleteEndpoint = endpointBase + '/delete';
	const listEndpoint = endpointBase + '/list';

	// All tests in this suite require existing users and posts.
	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.testUsers = await common.reloadTestUsers ();
		this.testPosts = await common.reloadTestPosts ();
	});

	// Verify that all endpoints require an auth token.
	it ("All endpoints require authorisation.", async function () {
		// Endpoints that take an ObjectID as a parameter can use a nonsense
		// value, since the authorisation check happens before parameter
		// validation.
		const endpoints = [
			{method: 'post', url: createEndpoint + '/DEADBEEF'},
			{method: 'delete', url: deleteEndpoint + '/DEADBEEF'},
			{method: 'get', url: listEndpoint + '/all'},
			{method: 'get', url: listEndpoint + '/user'}
		];

		for (const endpoint of endpoints)
			await axios ({method: endpoint.method, url: endpoint.url})
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (401);
				});
	});

	// Verify that the owner of a post cannot like the post.
	it ("The post owner cannot like the post.", async function () {
		for (const post of this.testPosts) {
			const header = {headers: common.createTokenHeader (post.owner.id)};
			const endpoint = createEndpoint + '/' + post.id;

			await axios.post (endpoint, {}, header)
				.then (function (response) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	// Verify that only the backer of a like can delete it.
	it ("Only the like backer can delete a like.", async function () {
		// Load the database with likes to delete.
		const testLikes = await common.reloadTestLikes ();

		for (const like of testLikes) {
			const endpoint = deleteEndpoint + '/' + like.id;

			for (const user of this.testUsers) {
				// Skip the backer.
				if (like.backer.id == user.id)
					continue;

				const header = {headers: common.createTokenHeader (user.id)};

				await axios.delete (endpoint, header)
					.then (function (response) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (400);
					});
			}
		}
	});

	// Test all CRUD methods.
	describe ("CRUD tests:", function () {
		describe ("Create tests:", function () {
			// Verify that the create endpoint requires a post id.
			it ("Request must include a post id.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};

				// Make the request without adding a post id to the
				// createEndpoint.
				await axios.post (createEndpoint, {}, header)
					.then (function (res) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			// Verify that the post id is valid.
			it ("Post id must be valid.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
				const endpoints = [
					// Malformed post id.
					createEndpoint + '/DEADBEEF',
					// Nonexistent post id.
					createEndpoint + '/12345678DEADBEEF98765432'
				];

				for (endpoint of endpoints)
					await axios.post (endpoint, {}, header)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			// User can like a post.
			it ("Users can like posts.", async function () {
				for (const post of this.testPosts) {
					const endpoint = createEndpoint + '/' + post.id;

					for (const user of this.testUsers) {
						// Skip the owner.
						if (user.id == post.owner.id)
							continue;

						const header = {headers: common.createTokenHeader (user.id)};

						await axios.post (endpoint, {}, header)
							.then (function (res) {
								expect (res.status).toBe (200);
								expect (res.data.post).toBe (post.id);
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});
					}
				}
			});

			// Verify that a user cannot like the same post twice.
			it ("Users cannot duplicate likes.", async function () {
				// Clear the database of likes.
				await common.deleteTestLikes ();

				for (const post of this.testPosts) {
					const endpoint = createEndpoint + '/' + post.id;

					for (const user of this.testUsers) {
						// Skip the owner.
						if (user.id == post.owner.id)
							continue;

						const header = {headers: common.createTokenHeader (user.id)};

						// The first like should be successful.
						await axios.post (endpoint, {}, header)
							.then (function (res) {
								expect (res.status).toBe (200);
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});

						// The second like should fail.
						await axios.post (endpoint, {}, header)
							.then (function (res) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
					}
				}
			});
		});

		describe ("Delete tests:", function () {
			// Verify that the delete endpoint requires a like id.
			it ("Request must include a like id.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};

				// Make the request without adding a comment id to the
				// deleteEndpoint.
				await axios.delete (deleteEndpoint, header)
					.then (function (res) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			// Verify that the like id is valid.
			it ("Like id must be valid.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
				const endpoints = [
					// Malformed like id.
					deleteEndpoint + '/DEADBEEF',
					// Nonexistent like id.
					deleteEndpoint + '/12345678DEADBEEF98765432'
				];

				for (endpoint of endpoints)
					await axios.delete (endpoint, header)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			// Test that like deletion works.
			it ("Users can delete likes.", async function () {
				// Load the database with like to delete.
				const testLikes = await common.reloadTestLikes ();

				for (const like of testLikes) {
					const header = {headers: common.createTokenHeader (like.backer.id)};
					const endpoint = deleteEndpoint + '/' + like.id;

					await axios.delete (endpoint, header)
						.then (function (res) {
							expect (res.status).toBe (200);
							expect (res.data.deletedCount).toBe (1);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});
	});

	describe ("List tests:", function () {
		beforeAll (function () {
			// Add matcher that verifies like ordering.
			jasmine.addMatchers ({
				toHaveAscendingCreationTimes: common.ascendingCreationTimesMatcher
			});
		});

		// All tests in this suite require existing likes.
		beforeEach (async function () { this.testLikes = await common.reloadTestLikes (); });

		// Verify that the scope must be valid.
		it ("Scope is not 'all' or 'user'.", async function () {
			const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
			const endpoint = listEndpoint + '/not_a_valid_scope';

			await axios.get (endpoint, header)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (404);
				});
		});

		// Verify the result of listing all likes, including ordering.
		it ("Scope is 'all'.", async function () {
			const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
			const endpoint = listEndpoint + '/all';

			await axios.get (endpoint, header)
				.then (async function (res) {
					expect (res.status).toBe (200);

					const nExpected = await LikeModel.countDocuments ();
					expect (res.data.length).toBe (nExpected);

					expect (res.data).toHaveAscendingCreationTimes ();
				})
				.catch (function (error) {
					expect (true).toBe (false);
				});
		});

		// Verify the result of listing user's comments, including ordering.
		it ("Scope is 'user'.", async function () {
			const endpoint = listEndpoint + '/user';

			for (const user of this.testUsers) {
				const header = {headers: common.createTokenHeader (user.id)};

				await axios.get (endpoint, header)
					.then (async function (res) {
						expect (res.status).toBe (200);

						const nExpected = await LikeModel.countDocuments ({backer: user});
						expect (res.data.length).toBe (nExpected);

						expect (res.data).toHaveAscendingCreationTimes ();
					})
					.catch (function (error) {
						expect (true).toBe (false);
					});
			}
		});
	});
});

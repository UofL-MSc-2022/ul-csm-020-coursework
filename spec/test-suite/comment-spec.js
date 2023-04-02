const axios = require ("axios");

const common = require ('../support/common');
const {CommentModel, commentValidationFields} = require ('../../source/models/comment');

common.initTestSuite ();

describe ("Comment endpoint tests:", function () {
	const endpointBase = common.BASE_URL + '/api/comment';
	const createEndpoint = endpointBase + '/create';
	const readEndpoint = endpointBase + '/read';
	const updateEndpoint = endpointBase + '/update';
	const deleteEndpoint = endpointBase + '/delete';
	const listEndpoint = endpointBase + '/list';

	const validParams = {body: 'body'};

	// All tests in this suite require existing users, posts, and comments.
	beforeAll (common.connectToTestDB);
	beforeEach (async function () {
		this.testUsers = await common.reloadTestUsers ();
		this.testPosts = await common.reloadTestPosts ();
		this.testComments = await common.reloadTestComments ();
	});

	// Verify that all endpoints require an auth token.
	it ("All endpoints require authorisation.", async function () {
		// Endpoints that take an ObjectID as a parameter can use a nonsense
		// value, since the authorisation check happens before parameter
		// validation.
		const endpoints = [
			{method: 'post', url: createEndpoint + '/DEADBEEF'},
			{method: 'get', url: readEndpoint + '/DEADBEEF'},
			{method: 'patch', url: updateEndpoint + '/DEADBEEF'},
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

	// Verify that the owner of a post cannot comment on the post.
	it ("The post owner cannot comment on the post.", async function () {
		for (const post of this.testPosts) {
			const header = {headers: common.createTokenHeader (post.owner.id)};
			const endpoint = createEndpoint + '/' + post.id;

			await axios.post (endpoint, validParams, header)
				.then (function (res) {
					expect (true).toBe (false);
				})
				.catch (function (error) {
					expect (error.response.status).toBe (400);
				});
		}
	});

	// Verify that only the author of a comment can update or delete it.
	it ("Only the comment author can update or delete a comment.", async function () {
		for (const comment of this.testComments) {
			const requestParams = [
				{
					method: 'patch',
					endpoint: updateEndpoint + '/' + comment.id,
					params: validParams
				},
				{
					method: 'delete',
					endpoint: deleteEndpoint + '/' + comment.id,
					params: {}
				}
			];

			for (const user of this.testUsers) {
				// Skip the author.
				if (user.id == comment.author.id)
					continue;

				const header = common.createTokenHeader (user.id);

				for (const params of requestParams) {
					requestConfig = {
						method: params.method,
						url: params.endpoint,
						data: params.params,
						headers: header
					};

					await axios (requestConfig)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			}
		}
	});

	// Test all CRUD methods.
	describe ("CRUD tests:", function () {
		// Short parameter values.
		const minParams = {body: "a"};

		// Long parameter values, based on the max length extracted from the
		// validation field array.
		const maxParams = {
			body: "a".repeat (common.maxValidLength (commentValidationFields, 'body') + 1)
		};

		describe ("Create tests:", function () {
			// Clear the comments collection before each spec.
			beforeEach (common.deleteTestComments);

			// Verify that required fields are enforced.
			it ("Request must include all required parameters.", async function () {
				for (const post of this.testPosts) {
					const endpoint = createEndpoint + '/' + post.id;

					for (const user of this.testUsers) {
						// Skip the post owner.
						if (user.id == post.owner.id)
							continue;

						const header = {headers: common.createTokenHeader (user.id)};

						// There is only 1 required parameter, therefore send
						// an empty body to test validation.
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

			// Verify that string parameters must conform to length constraints.
			it ("Parameters must conform to length constraints.", async function () {
				// Test both sides of the valid body length range.
				const testParams = [
					{body: minParams.body},
					{body: maxParams.body}
				];

				for (const post of this.testPosts) {
					const endpoint = createEndpoint + '/' + post.id;

					for (const user of this.testUsers) {
						// Skip the post owner.
						if (user.id == post.owner.id)
							continue;

						const header = {headers: common.createTokenHeader (user.id)};

						for (const params of testParams)
							await axios.post (endpoint, params, header)
								.then (function (res) {
									expect (true).toBe (false);
								})
								.catch (function (error) {
									expect (error.response.status).toBe (400);
								});
					}
				}
			});

			// Test that comment creation works.
			it ("Users can create comments.", async function () {
				for (const post of this.testPosts) {
					const endpoint = createEndpoint + '/' + post.id;

					for (const user of this.testUsers) {
						// Skip the post owner.
						if (user.id == post.owner.id)
							continue;

						const header = {headers: common.createTokenHeader (user.id)};

						await axios.post (endpoint, validParams, header)
							.then (function (res) {
								expect (res.status).toBe (200);
								expect (res.data.post).toBe (post.id);
								expect (res.data.author).toBe (user.id);
							})
							.catch (function (error) {
								expect (true).toBe (false);
							});
					}
				}
			});
		});

		describe ("Read tests:", function () {
			// Verify that the read endpoint requires a comment id.
			it ("Request must include a comment id.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};

				// Make the request without adding a post id to the
				// readEndpoint.
				await axios.get (readEndpoint, header)
					.then (function (res) {
						expect (true).toBe (false);
					})
					.catch (function (error) {
						expect (error.response.status).toBe (404);
					});
			});

			// Verify that the comment id is valid.
			it ("Comment id must be valid.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
				const endpoints = [
					// Malformed comment id.
					readEndpoint + '/DEADBEEF',
					// Nonexistent comment id.
					readEndpoint + '/12345678DEADBEEF98765432'
				];

				for (endpoint of endpoints)
					await axios.get (endpoint, header)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
			});

			// User can read comment.
			it ("Users can read comments.", async function () {
				for (const comment of this.testComments) {
					const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
					const endpoint = readEndpoint + '/' + comment.id;

					await axios.get (endpoint, header)
						.then (function (res) {
							expect (res.status).toBe (200);
							expect (res.data.id).toBe (comment.id);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("Update tests:", function () {
			// Verify that required fields are enforced.
			it ("Request must include all required parameters.", async function () {
				for (const comment of this.testComments) {
					const endpoint = updateEndpoint + '/' + comment.id;
					const header = {headers: common.createTokenHeader (comment.author.id)};

					// There is only 1 required parameter, therefore send an
					// empty body to test validation.
					await axios.patch (endpoint, {}, header)
						.then (function (res) {
							expect (true).toBe (false);
						})
						.catch (function (error) {
							expect (error.response.status).toBe (400);
						});
				}
			});

			// Verify that string parameters must conform to length constraints.
			it ("Parameters must conform to length constraints.", async function () {
				// Test both sides of the valid body length range.
				const testParams = [
					{body: minParams.body},
					{body: maxParams.body}
				];

				for (const comment of this.testComments) {
					const header = {headers: common.createTokenHeader (comment.author.id)};
					const endpoint = updateEndpoint + '/' + comment.id;

					for (const params of testParams)
						await axios.patch (endpoint, params, header)
							.then (function (res) {
								expect (true).toBe (false);
							})
							.catch (function (error) {
								expect (error.response.status).toBe (400);
							});
				}
			});

			// Test that comment updating works.
			it ("Users can update comments.", async function () {
				for (const comment of this.testComments) {
					const header = {headers: common.createTokenHeader (comment.author.id)};
					const endpoint = updateEndpoint + '/' + comment.id;

					await axios.patch (endpoint, validParams, header)
						.then (function (res) {
							expect (res.status).toBe (200);
							expect (res.data.body).toBe (validParams.body);
						})
						.catch (function (error) {
							expect (true).toBe (false);
						});
				}
			});
		});

		describe ("Delete tests:", function () {
			// Verify that the delete endpoint requires a comment id.
			it ("Request must include a comment id.", async function () {
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

			// Verify that the comment id is valid.
			it ("Comment id must be valid.", async function () {
				const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
				const endpoints = [
					// Malformed comment id.
					deleteEndpoint + '/DEADBEEF',
					// Nonexistent comment id.
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

			// Test that comment deletion works.
			it ("Users can delete comments.", async function () {
				for (const comment of this.testComments) {
					const header = {headers: common.createTokenHeader (comment.author.id)};
					const endpoint = deleteEndpoint + '/' + comment.id;

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
			// Add matcher that verifies comment ordering.
			jasmine.addMatchers ({
				toHaveAscendingCreationTimes: common.ascendingCreationTimesMatcher
			});
		});

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

		// Verify the result of listing all comments, including ordering.
		it ("Scope is 'all'.", async function () {
			const header = {headers: common.createTokenHeader (this.testUsers[0].id)};
			const endpoint = listEndpoint + '/all';

			await axios.get (endpoint, header)
				.then (async function (res) {
					expect (res.status).toBe (200);

					const nExpected = await CommentModel.countDocuments ();
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

						const nExpected = await CommentModel.countDocuments ({author: user});
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

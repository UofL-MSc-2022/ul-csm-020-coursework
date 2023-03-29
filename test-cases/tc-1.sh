#! /usr/bin/zsh

source ${0:a:h}/setup

REGISTER_ENDPOINT="/api/user/register"

OLGA_POST='{"screen_name":"Olga","email":"olga@miniwall.com","password":"olgapass"}'
NICK_POST='{"screen_name":"Nick","email":"nick@miniwall.com","password":"nickpass"}'
MARY_POST='{"screen_name":"Mary","email":"mary@miniwall.com","password":"marypass"}'

for post_data in $OLGA_POST $NICK_POST $MARY_POST ; do
	echo "Request:"
	echo "\tPOST $REGISTER_ENDPOINT"
	echo "\tPOST data: $post_data"

	post_request $REGISTER_ENDPOINT $post_data

	echo "Response:"
	echo "\tHTTP status code: $post_code"
	echo "\tServer response body: $post_body"
	echo
done

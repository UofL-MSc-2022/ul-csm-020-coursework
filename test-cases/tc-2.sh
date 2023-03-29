#! /usr/bin/zsh

source ${0:a:h}/setup

SIGN_IN_ENDPOINT="/api/user/sign-in"

OLGA_POST='{"email":"olga@miniwall.com","password":"olgapass"}'
NICK_POST='{"email":"nick@miniwall.com","password":"nickpass"}'
MARY_POST='{"email":"mary@miniwall.com","password":"marypass"}'

tokens=()
for post_data in $OLGA_POST $NICK_POST $MARY_POST ; do
	echo "Request:"
	echo "\tPOST $SIGN_IN_ENDPOINT"
	echo "\tPOST data: $post_data"

	post_request $SIGN_IN_ENDPOINT $post_data

	echo "Response:"
	echo "\tHTTP status code: $post_code"
	echo "\tServer response body: $post_body"
	echo

	tokens+=(${post_body:15:-2})
done

cat <<EOF >! ${0:a:h}/tokens
export OLGA_TOKEN=$tokens[1]
export NICK_TOKEN=$tokens[2]
export MARY_TOKEN=$tokens[3]
EOF

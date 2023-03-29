#! /usr/bin/zsh

source ${0:a:h}/setup

end_point="/api/user/sign-in"

olga_data='{"email":"olga@miniwall.com","password":"olgapass"}'
nick_data='{"email":"nick@miniwall.com","password":"nickpass"}'
mary_data='{"email":"mary@miniwall.com","password":"marypass"}'

tokens=()
for post_data in $olga_data $nick_data $mary_data ; do
	echo "Request:"
	echo "\tPOST $end_point"
	echo "\tPOST data: $post_data"

	post_request $end_point $post_data

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

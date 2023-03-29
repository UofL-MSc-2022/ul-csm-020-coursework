#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens
source ${0:a:h}/posts

end_point="/api/like/create/$MARY_POST"

tokens=($NICK_TOKEN $OLGA_TOKEN)

for token in $NICK_TOKEN $OLGA_TOKEN ; do
	echo "--- Request ------------"
	echo "POST $end_point"

	post_request $end_point "" $token

	echo "--- Response -----------"
	echo $post_code
	echo $post_body | $pretty_print_json[@]
	echo "------------------------"
done

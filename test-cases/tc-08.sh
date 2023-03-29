#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens
source ${0:a:h}/posts

end_point="/api/comment/create/$MARY_POST"

olga_data='{"body":"Olga comment."}'
nick_data='{"body":"Nick comment."}'

post_bodies=($nick_data $olga_data)
tokens=($NICK_TOKEN $OLGA_TOKEN)

for i in 1 2 ; do
	echo "--- Request ------------"
	echo "POST $end_point"
	echo $post_data

	post_request $end_point $post_bodies[$i] $tokens[$i]

	echo "--- Response -----------"
	echo $post_code
	echo $post_body | $pretty_print_json[@]
	echo "------------------------"
done;

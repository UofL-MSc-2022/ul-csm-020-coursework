#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens

end_point="/api/post/create"

olga_data='{"title":"Olga Title","body":"Olga body."}'
nick_data='{"title":"Nick Title","body":"Nick body."}'
mary_data='{"title":"Mary Title","body":"Mary body."}'

post_bodies=($olga_data $nick_data $mary_data)
tokens=($OLGA_TOKEN $NICK_TOKEN $MARY_TOKEN)

post_ids=()
for i in 1 2 3 ; do
	echo "--- Request ------------"
	echo "POST $end_point"
	echo $post_data

	post_request $end_point $post_bodies[$i] $tokens[$i]

	echo "--- Response -----------"
	echo $post_code
	echo $post_body | $pretty_print_json[@]
	echo "------------------------"

	post_ids+=`echo $post_body | grep -Po '"_id":"\K[^"]*'`

	sleep 3
done;

cat <<EOF >! ${0:a:h}/posts
export OLGA_POST=$post_ids[1]
export NICK_POST=$post_ids[2]
export MARY_POST=$post_ids[3]
EOF

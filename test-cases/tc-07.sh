#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens

end_point="/api/post/list/all"

for token in $NICK_TOKEN $OLGA_TOKEN ; do
	echo "--- Request ------------"
	echo "GET $end_point"

	get_request $end_point $token

	echo "--- Response -----------"
	echo $get_code
	echo $get_body | $pretty_print_json[@]
	echo "------------------------"
	echo
done

#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens

end_point="/api/post/list/all"

echo "--- Request ------------"
echo "GET $end_point"

get_request $end_point $NICK_TOKEN

echo "--- Response -----------"
echo $get_code
echo $get_body | $pretty_print_json[@]
echo "------------------------"

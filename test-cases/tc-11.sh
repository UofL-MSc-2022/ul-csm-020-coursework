#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens
source ${0:a:h}/posts

end_point="/api/post/read/$MARY_POST"

echo "--- Request ------------"
echo "GET $end_point"

get_request $end_point $MARY_TOKEN

echo "--- Response -----------"
echo $get_code
echo $get_body | $pretty_print_json[@]
echo "------------------------"

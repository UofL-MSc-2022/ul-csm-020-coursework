#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens
source ${0:a:h}/posts

end_point="/api/comment/create/$MARY_POST"
post_data='{"body":"Mary comment."}'

echo "--- Request ------------"
echo "POST $end_point"
echo $post_data

post_request $end_point $post_data $MARY_TOKEN

echo "--- Response -----------"
echo $post_code
echo $post_body | $pretty_print_json[@]
echo "------------------------"

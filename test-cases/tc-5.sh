#! /usr/bin/zsh

source ${0:a:h}/setup
source ${0:a:h}/tokens

end_point="/api/post/create"
post_data='{"title":"Nick Title","body":"Nick body."}'

echo "Request:"
echo "\tPOST $end_point"

post_request $end_point $post_data $NICK_TOKEN

echo "Response:"
echo "\tHTTP status code: $post_code"
echo "\tServer response body: $post_body"

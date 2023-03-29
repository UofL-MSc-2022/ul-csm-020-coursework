#! /usr/bin/zsh

source ${0:a:h}/setup

end_point="/api/version"

echo "Request:"
echo "\tGET $end_point"

get_request $end_point

echo "Response:"
echo "\tHTTP status code: $get_code"
echo "\tServer response body: $get_body"

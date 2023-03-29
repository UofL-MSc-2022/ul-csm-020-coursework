#! /usr/bin/zsh

source ${0:a:h}/setup

VERSION_ENDPOINT="/api/version"

echo "Request:"
echo "\tGET $VERSION_ENDPOINT"

get_request $VERSION_ENDPOINT

echo "Response:"
echo "\tHTTP status code: $get_code"
echo "\tServer response body: $get_body"

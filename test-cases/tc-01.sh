#! /usr/bin/zsh

source ${0:a:h}/setup

end_point="/api/user/register"

olga_data='{"screen_name":"Olga","email":"olga@miniwall.com","password":"olgapass"}'
nick_data='{"screen_name":"Nick","email":"nick@miniwall.com","password":"nickpass"}'
mary_data='{"screen_name":"Mary","email":"mary@miniwall.com","password":"marypass"}'

for post_data in $olga_data $nick_data $mary_data ; do
	echo "--- Request ------------"
	echo "POST $end_point"
	echo $post_data

	post_request $end_point $post_data

	echo "--- Response -----------"
	echo $post_code
	echo $post_body | $pretty_print_json[@]
	echo "------------------------"
	echo
done

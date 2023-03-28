#! /usr/bin/zsh

source ${0:a:h}/setup

echo "Reset network ..."
echo -n "  rm: "
docker network rm $NETWORK_NAME
echo -n "  create $NETWORK_NAME: "
docker network create --subnet=$IP_RANGE --ip-range=$IP_RANGE --gateway=$GATEWAY $NETWORK_NAME

echo "Build prod-app ..."
docker image rm $PROD_APP_IMAGE
docker build -t $PROD_APP_IMAGE --target prod-app .

echo "Build test-app ..."
docker image rm $TEST_APP_IMAGE
docker build -t $TEST_APP_IMAGE --target test-app .

echo "Build test-suite ..."
docker image rm $TEST_SUITE_IMAGE
docker build -t $TEST_SUITE_IMAGE --target test-suite .

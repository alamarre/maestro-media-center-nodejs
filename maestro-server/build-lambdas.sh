#!/bin/bash
export NODE_ENV=production;
#./node_modules/.bin/webpack --config webpack.config.js --progress --colors

for filename in src/lambdas/*.ts; do
    export LAMBDA_NAME=$(basename -s .ts $filename)
    echo processing src/lambdas/${LAMBDA_NAME}.ts
    ./node_modules/.bin/webpack --config webpack.config.js --progress --colors
done
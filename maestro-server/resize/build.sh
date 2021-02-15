mkdir build
rm package.json
cp ../package.json ./package.json
npm uninstall -- save aws-sdk

docker build -t sharp-builder .

cp -R ../src/ ./build/src

docker run --volume ${PWD}/build:/build sharp-builder sh -c "cp -r ./* /build"
sed -i bak -e 's/process.env.MAIN_ACCOUNT/"'"$MAIN_ACCOUNT_ID"'"/' build/src/lambdas/MetadataImageResizer.js
#cp -R build/node_modules/sharp/vendor/lib build/lib/

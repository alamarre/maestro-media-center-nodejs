FROM lambci/lambda:build-nodejs8.10

ADD package.json .
RUN npm install jimp
#RUN npm install sharp
#RUN ldd node_modules/sharp/build/Release/sharp.node
#RUN ln -s ./node_modules/sharp/vendor/lib ./lib
#ADD index.js .
#ADD test.png .
#RUN node index.js
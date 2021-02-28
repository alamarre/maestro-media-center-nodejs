FROM public.ecr.aws/lambda/nodejs:14

RUN mkdir build
WORKDIR build
ADD package.json ./
RUN npm i
ADD tsconfig.json ./
ADD src ./src
RUN mkdir out
RUN npm run build
RUN cp -r out/* /var/task
WORKDIR /var/task

CMD [ "lambdas/server.handler" ]

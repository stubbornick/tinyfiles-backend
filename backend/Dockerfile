FROM node:lts

RUN npm install -g typescript

USER tinyfiles

COPY yarn.lock package.json /project/
WORKDIR /project/
RUN yarn install

COPY . /project/
RUN yarn run build

CMD yarn run --silent start
EXPOSE 3000

FROM node:lts

RUN npm install -g typescript

ARG USER_ID
ARG GROUP_ID

RUN deluser node

RUN addgroup --gid $GROUP_ID user
RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID user
USER user

COPY --chown=user:user yarn.lock package.json /app/
WORKDIR /app/
RUN yarn install

COPY --chown=user:user . /app/
RUN yarn run build

CMD yarn run --silent start
EXPOSE 3000

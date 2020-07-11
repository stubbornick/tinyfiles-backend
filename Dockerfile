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

EXPOSE 3000
VOLUME /app/data/

# Not using yarn since it answers with error code 1 on SIGTERM and can't propagate SIGINT
ENTRYPOINT ["/usr/local/bin/node", "dist/src/server.js"]

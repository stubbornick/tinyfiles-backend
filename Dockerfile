FROM node:lts

RUN npm install -g typescript

ARG USER_ID
ARG GROUP_ID

RUN deluser node

RUN addgroup --gid $GROUP_ID user
RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID user
USER user

COPY --chown=user:user package-lock.json package.json /app/
WORKDIR /app/
RUN npm install

COPY --chown=user:user . /app/
RUN npm run build

EXPOSE 3000
VOLUME /app/data/

CMD ["npm", "run", "--silent", "start:prod"]

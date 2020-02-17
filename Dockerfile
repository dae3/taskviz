FROM node:10-slim

RUN npm install --global nodemon
USER node
ENV DEBUG="taskviz* -taskviz:api"
WORKDIR /data
EXPOSE 3000
CMD nodemon

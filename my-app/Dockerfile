# Build the client app
FROM node:18 as build-stage
WORKDIR /app
COPY client ./client
COPY client/package.json ./client/
RUN cd client && npm install && npm run build

# Set up the Node.js server
FROM node:18 as production-stage
WORKDIR /app
COPY server ./server
COPY server/package.json ./server/
COPY --from=build-stage /app/client/build ./server/public
RUN cd server && npm install

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]

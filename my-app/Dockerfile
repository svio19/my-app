# Build the client app
FROM node:18 AS build-stage
WORKDIR /app
# Copy client package.json and install dependencies
COPY client/package.json ./client/
RUN cd client && npm install
# Copy all client files and build the React app
COPY client ./client
RUN cd client && npm run build

# Set up the Node.js server
FROM node:18 AS production-stage
WORKDIR /app
# Set the environment to production
ENV NODE_ENV=production
# Copy server package.json and install dependencies
COPY server/package.json ./server/
RUN cd server && npm install
# Copy all server files
COPY server ./server
# Copy the built client files to the server's public folder
COPY --from=build-stage /app/client/build ./server/public

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]

# Build the client app
FROM node:18 as build-stage
WORKDIR /app
# Copy package.json first to leverage caching
COPY client/package.json ./client/
# Install client dependencies
RUN cd client && npm install
# Copy the rest of the client files and build
COPY client ./client
RUN cd client && npm run build

# Set up the Node.js server
FROM node:18 as production-stage
WORKDIR /app
# Set the environment to production
ENV NODE_ENV=production
# Copy server package.json and install dependencies
COPY server/package.json ./server/
RUN cd server && npm install
# Copy the server files
COPY server ./server
# Copy the built client files to the public folder
COPY --from=build-stage /app/client/build ./server/public

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]

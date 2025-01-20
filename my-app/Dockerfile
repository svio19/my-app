# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy app source
COPY . .

# Build React app
RUN cd client && npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
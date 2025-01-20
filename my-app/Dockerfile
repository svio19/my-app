FROM node:18-alpine

WORKDIR /app

# Copy root package.json
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy all source files
COPY . .

# Build React app
RUN npm run build

# Expose port for server
EXPOSE 3000

# Start server
CMD ["npm", "start"]

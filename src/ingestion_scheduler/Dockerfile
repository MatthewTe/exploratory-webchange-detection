FROM node:21-alpine3.18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npx tsc

# Expose the port the app runs on
EXPOSE 3001

CMD ["npx", "nodemon", "build/index.js"]
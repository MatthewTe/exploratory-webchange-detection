FROM selenium/standalone-docker:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
USER root
RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm
RUN npm install npm@6 -g && \
    npm install n -g && \
    n latest
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npx tsc

# Expose the port the app runs on
EXPOSE 3001

CMD ["npx", "nodemon", "build/index.js"]
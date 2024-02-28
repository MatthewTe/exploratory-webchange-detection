FROM node:21-alpine3.18

# Install required packages
RUN apk update && \
    apk add --no-cache \
    wget \
    curl \
    unzip \
    xvfb \
    chromium \
    udev \
    ttf-freefont \
    fontconfig

# Install Chrome WebDriver
RUN wget https://chromedriver.storage.googleapis.com/96.0.4664.45/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/local/bin && \
    chmod +x /usr/local/bin/chromedriver

# Set environment variables
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROME_PATH=/usr/bin/google-chrome
ENV DISPLAY=:99


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
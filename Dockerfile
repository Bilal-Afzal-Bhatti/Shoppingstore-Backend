FROM node:22-alpine
WORKDIR /app

# Copying package files first helps with layer caching
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Match the port in your .env (PORT=5731)
EXPOSE 5731

# Ensure app.js exists in your root or update this to your entry point (e.g., server.js)
# Change this line in your Backend Dockerfile
CMD ["node", "server.js"]
FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies and TypeScript globally
RUN npm install
RUN npm install -g typescript

COPY . .

# Compile TypeScript
RUN npm run build

# Start the application
CMD ["npm", "start"]
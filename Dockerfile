FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies and TypeScript globally
RUN npm install
RUN npm install -g typescript

COPY . .

# Copy the entrypoint script from the root of the project
COPY ./entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

# Compile TypeScript
RUN npm run build

# Set the entrypoint script
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]

# Start the application
CMD ["npm", "start"]
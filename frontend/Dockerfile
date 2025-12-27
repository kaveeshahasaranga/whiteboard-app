FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# React dev server එක දුවන port එක
EXPOSE 3000

CMD ["npm", "start"]
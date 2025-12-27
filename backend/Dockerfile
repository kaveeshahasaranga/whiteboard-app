# Node.js version එක තෝරාගැනීම
FROM node:18

# Container එක ඇතුළේ වැඩ කරන folder එක
WORKDIR /app

# package files කොපි කරලා dependencies install කිරීම
COPY package*.json ./
RUN npm install

# ඉතිරි ඔක්කොම files කොපි කිරීම
COPY . .

# Server එක දුවන port එක
EXPOSE 5000

# Server එක start කරන command එක
CMD ["node", "server.js"]
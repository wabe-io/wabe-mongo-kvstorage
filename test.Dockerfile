FROM node:16.20-alpine
WORKDIR /app

# Install dependencies only when needed
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copies source code
COPY . .

CMD sh -c "yarn typecheck && yarn circular-deps && yarn prettier && yarn lint && yarn test-internal"

  
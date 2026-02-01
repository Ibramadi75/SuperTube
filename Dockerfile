# Stage 1: Build React client
FROM node:20-alpine AS client-build
WORKDIR /app
COPY src/client/package*.json ./
RUN npm ci
COPY src/client/ ./
RUN npm run build

# Stage 2: Build .NET API
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS api-build
WORKDIR /src
COPY src/SuperTube.Api/*.csproj ./
RUN dotnet restore
COPY src/SuperTube.Api/ ./
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy .NET API
COPY --from=api-build /app/publish ./

# Copy React build to nginx
COPY --from=client-build /app/dist /var/www/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories
RUN mkdir -p /data /youtube /var/run/nginx

# Environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV DATA_PATH=/data
ENV YTDLP_API_URL=http://ytdlp-api:3001
ENV WEBHOOK_HOST=localhost
ENV WEBHOOK_PORT=9001

# Expose port 80 (nginx)
EXPOSE 80

# Start script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

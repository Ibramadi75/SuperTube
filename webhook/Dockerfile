FROM alpine:3.19

# Install webhook and curl
RUN apk add --no-cache curl webhook

# Copy scripts
COPY scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Copy hooks configuration
COPY hooks.json /etc/webhook/hooks.json

# Entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]

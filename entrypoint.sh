#!/bin/bash

# Update startTime.json with the current date
echo "{\"startTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /usr/src/app/startTime.json

# Execute the main command
exec "$@"
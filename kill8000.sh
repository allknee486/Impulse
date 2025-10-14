#!/bin/bash

# Kill any processes using port 8000 (Django's default port)
PORT_NUMBER=8000
lsof -i tcp:${PORT_NUMBER} | awk 'NR!=1 {print $2}' | xargs kill
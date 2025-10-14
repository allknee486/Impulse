#!/bin/bash

# Kill any Python processes using port 8000 (Django's default port)
PORT_NUMBER=8000
PROC_NAME=python
lsof -i tcp:${PORT_NUMBER} | awk -v name="$PROC_NAME" 'NR!=1 && $0 ~ name {print $2}' | xargs -r kill
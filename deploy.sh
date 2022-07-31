#!/usr/bin/bash
cd /root/gogo-mint
git pull
docker compose up -d --build

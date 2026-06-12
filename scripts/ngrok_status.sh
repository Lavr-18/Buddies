#!/bin/bash
curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
try:
    t = json.load(sys.stdin).get('tunnels', [])
    print(t[0]['public_url'], '->', t[0]['config']['addr']) if t else print('ngrok не работает')
except:
    print('ngrok не работает')
"

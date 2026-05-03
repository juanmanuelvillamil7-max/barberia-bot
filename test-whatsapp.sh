#!/bin/bash
curl -s -X POST 'https://graph.facebook.com/v25.0/948589365014791/messages' \
  -H "Authorization: Bearer $WA_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"messaging_product":"whatsapp","to":"542215459189","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'

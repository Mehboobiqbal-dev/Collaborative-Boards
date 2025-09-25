#!/bin/bash

# Collaborative Boards Demo Script
# This script demonstrates the API endpoints and functionality

API_URL="http://localhost:4000/api"

echo "=== Collaborative Boards API Demo ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API calls
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4

    echo -e "${BLUE}${method} ${endpoint}${NC}"

    if [ "$method" = "GET" ]; then
        if [ -n "$auth_header" ]; then
            curl -s -X $method "$API_URL$endpoint" -H "Authorization: Bearer $auth_header" | jq '.' 2>/dev/null || curl -s -X $method "$API_URL$endpoint" -H "Authorization: Bearer $auth_header"
        else
            curl -s -X $method "$API_URL$endpoint" | jq '.' 2>/dev/null || curl -s -X $method "$API_URL$endpoint"
        fi
    else
        if [ -n "$auth_header" ]; then
            curl -s -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" | jq '.' 2>/dev/null || curl -s -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data"
        else
            curl -s -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" | jq '.' 2>/dev/null || curl -s -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    fi
    echo ""
}

echo -e "${YELLOW}1. Health Check${NC}"
call_api "GET" "/health"

echo -e "${YELLOW}2. User Signup${NC}"
SIGNUP_RESPONSE=$(call_api "POST" "/auth/signup" '{
  "email": "demo@example.com",
  "password": "DemoPass123!",
  "name": "Demo User"
}')

echo -e "${YELLOW}3. Email Verification${NC}"
# Extract verification token from signup response (in real app, this would come via email)
VERIFICATION_TOKEN="demo-token-123"
call_api "POST" "/auth/verify" "{
  \"email\": \"demo@example.com\",
  \"token\": \"$VERIFICATION_TOKEN\"
}"

echo -e "${YELLOW}4. User Login${NC}"
LOGIN_RESPONSE=$(call_api "POST" "/auth/login" '{
  "email": "demo@example.com",
  "password": "DemoPass123!"
}')

# Extract access token from login response
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo -e "${YELLOW}5. Get Current User${NC}"
call_api "GET" "/users/me" "" "$ACCESS_TOKEN"

echo -e "${YELLOW}6. Create Board${NC}"
BOARD_RESPONSE=$(call_api "POST" "/boards" '{
  "title": "Demo Project Board"
}' "$ACCESS_TOKEN")

# Extract board ID
BOARD_ID=$(echo $BOARD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

echo -e "${YELLOW}7. Get User Boards${NC}"
call_api "GET" "/boards" "" "$ACCESS_TOKEN"

echo -e "${YELLOW}8. Create List${NC}"
LIST_RESPONSE=$(call_api "POST" "/boards/$BOARD_ID/lists" '{
  "title": "To Do",
  "position": 0
}' "$ACCESS_TOKEN")

# Extract list ID
LIST_ID=$(echo $LIST_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

echo -e "${YELLOW}9. Create Card${NC}"
CARD_RESPONSE=$(call_api "POST" "/lists/$LIST_ID/cards" '{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication with signup, login, and email verification",
  "labels": ["auth", "backend"]
}' "$ACCESS_TOKEN")

# Extract card ID
CARD_ID=$(echo $CARD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

echo -e "${YELLOW}10. Add Comment to Card${NC}"
call_api "POST" "/cards/$CARD_ID/comments" '{
  "content": "This is a demo comment on the authentication card."
}' "$ACCESS_TOKEN"

echo -e "${YELLOW}11. Update Card${NC}"
call_api "PATCH" "/cards/$CARD_ID" '{
  "description": "Add JWT-based authentication with signup, login, email verification, and password hashing"
}' "$ACCESS_TOKEN"

echo -e "${YELLOW}12. Search Cards${NC}"
call_api "GET" "/cards/search?query=authentication" "" "$ACCESS_TOKEN"

echo -e "${YELLOW}13. Get Board with Full Data${NC}"
call_api "GET" "/boards/$BOARD_ID" "" "$ACCESS_TOKEN"

echo -e "${YELLOW}14. Get Notifications${NC}"
call_api "GET" "/notifications" "" "$ACCESS_TOKEN"

echo -e "${YELLOW}15. Logout${NC}"
call_api "POST" "/auth/logout" '{
  "refreshToken": "demo-refresh-token"
}' "$ACCESS_TOKEN"

echo -e "${GREEN}=== Demo Complete ===${NC}"
echo ""
echo "Admin user credentials:"
echo "Email: admin@example.com"
echo "Password: AdminPass123!"
echo ""
echo "To run the full application:"
echo "docker-compose up --build"
echo ""
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:4000"

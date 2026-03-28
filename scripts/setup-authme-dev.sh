#!/bin/bash
# =============================================================================
# AuthMe Dev Environment Setup Script
# =============================================================================
# This script configures AuthMe for the Real Estate CRM dev environment
# Prerequisites:
#   - AuthMe is running at http://localhost:3001
#   - jq is installed (for JSON parsing)
#   - curl is available
#
# Usage:
#   chmod +x scripts/setup-authme-dev.sh
#   ./scripts/setup-authme-dev.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AUTHME_URL="http://localhost:3001"
REALM_NAME="real-estate-dev"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"  # Change this to your actual admin password

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}AuthMe Dev Environment Setup Script${NC}"
echo -e "${BLUE}=====================================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v curl &> /dev/null; then
    echo -e "${RED}ERROR: curl is not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}ERROR: jq is not installed. Install with: sudo apt-get install jq${NC}"
    exit 1
fi

# Check AuthMe connectivity
echo "Checking AuthMe connectivity..."
if ! curl -s -f "$AUTHME_URL/admin" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to AuthMe at $AUTHME_URL${NC}"
    echo "Make sure AuthMe is running: docker-compose -f docker-compose.dev-full.yml up -d"
    exit 1
fi
echo -e "${GREEN}✓ AuthMe is running${NC}\n"

# Get admin token
echo -e "${YELLOW}Authenticating as admin...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "$AUTHME_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USERNAME" \
  -d "password=$ADMIN_PASSWORD" | jq -r '.access_token' 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}ERROR: Failed to get admin token${NC}"
    echo "Check admin credentials: username=$ADMIN_USERNAME, password=$ADMIN_PASSWORD"
    exit 1
fi
echo -e "${GREEN}✓ Admin token obtained${NC}\n"

# Create Realm
echo -e "${YELLOW}Creating realm: $REALM_NAME${NC}"
REALM_RESPONSE=$(curl -s -X POST "$AUTHME_URL/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'$REALM_NAME'",
    "displayName": "Real Estate Dev",
    "enabled": true,
    "accessTokenLifespan": 1800,
    "refreshTokenMaxReuse": 0,
    "sslRequired": "none"
  }')

if curl -s -X GET "$AUTHME_URL/admin/realms/$REALM_NAME" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Realm created successfully${NC}\n"
else
    echo -e "${YELLOW}⚠ Realm may already exist or creation failed${NC}\n"
fi

# Function to create role
create_role() {
    local role_name=$1
    local role_description=$2
    
    echo "  Creating role: $role_name"
    curl -s -X POST "$AUTHME_URL/admin/realms/$REALM_NAME/roles" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "'$role_name'",
        "description": "'$role_description'",
        "composite": false,
        "clientRole": false
      }' > /dev/null 2>&1
    
    echo -e "  ${GREEN}✓ $role_name${NC}"
}

# Create Roles
echo -e "${YELLOW}Creating realm roles...${NC}"
create_role "crm-admin" "Full system access"
create_role "crm-manager" "Manage agents and reports"
create_role "crm-agent" "View own data only"
echo ""

# Function to create client
create_client() {
    local client_id=$1
    local access_type=$2
    local redirect_uris=$3
    local web_origins=$4
    
    echo "  Creating client: $client_id (Access Type: $access_type)"
    
    local client_config='{
        "clientId": "'$client_id'",
        "name": "'$client_id'",
        "enabled": true,
        "clientAuthenticatorType": "client-secret",
        "redirectUris": ['$redirect_uris'],
        "publicClient": '$([[ "$access_type" == "Public" ]] && echo "true" || echo "false")',
        "directAccessGrantsEnabled": true,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "serviceAccountsEnabled": '$([[ "$access_type" == "Confidential" ]] && echo "true" || echo "false")',
        "protocol": "openid-connect"
    }'
    
    if [ -n "$web_origins" ]; then
        client_config=$(echo $client_config | jq '. + {"webOrigins": ['$web_origins']}')
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AUTHME_URL/admin/realms/$REALM_NAME/clients" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$client_config")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "201" ]; then
        CLIENT_ID=$(echo "$BODY" | jq -r '.id // empty')
        echo -e "  ${GREEN}✓ $client_id created${NC}"
        echo "$CLIENT_ID"
    else
        # Try to get existing client
        CLIENT_ID=$(curl -s -X GET "$AUTHME_URL/admin/realms/$REALM_NAME/clients?clientId=$client_id" \
          -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id // empty')
        
        if [ -n "$CLIENT_ID" ]; then
            echo -e "  ${YELLOW}⚠ $client_id already exists${NC}"
            echo "$CLIENT_ID"
        else
            echo -e "  ${RED}✗ Failed to create $client_id${NC}"
            return 1
        fi
    fi
}

# Create Clients
echo -e "${YELLOW}Creating OAuth2/OIDC clients...${NC}"

# admin-portal
ADMIN_PORTAL_ID=$(create_client "admin-portal" "Public" \
    '"http://localhost:5173/*"' \
    '"http://localhost:5173"')

# agent-portal
AGENT_PORTAL_ID=$(create_client "agent-portal" "Public" \
    '"http://localhost:5174/*"' \
    '"http://localhost:5174"')

# mobile
MOBILE_ID=$(create_client "mobile" "Public" \
    '"app://real-estate-crm/*", "com.realestatecrm://*"' \
    '')

# crm-backend (Confidential)
CRM_BACKEND_ID=$(create_client "crm-backend" "Confidential" \
    '' \
    '')

echo ""

# Get crm-backend client secret
echo -e "${YELLOW}Retrieving crm-backend client credentials...${NC}"
if [ -n "$CRM_BACKEND_ID" ]; then
    CREDENTIALS=$(curl -s -X GET "$AUTHME_URL/admin/realms/$REALM_NAME/clients/$CRM_BACKEND_ID/client-secret" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    CLIENT_SECRET=$(echo "$CREDENTIALS" | jq -r '.value // empty')
    
    if [ -n "$CLIENT_SECRET" ]; then
        echo -e "${GREEN}✓ Client Secret obtained${NC}"
        echo -e "\n${YELLOW}crm-backend Client Secret:${NC}"
        echo -e "${RED}$CLIENT_SECRET${NC}\n"
        
        # Save to a temporary file for reference
        echo "$CLIENT_SECRET" > /tmp/authme-client-secret.txt
        echo -e "${BLUE}Saved to: /tmp/authme-client-secret.txt${NC}\n"
    fi
fi

# Function to create user
create_user() {
    local email=$1
    local password=$2
    local role_name=$3
    local first_name=$4
    local last_name=$5
    
    echo "  Creating user: $email"
    
    # Create user (AuthMe uses separate endpoints for user creation, password, and roles)
    USER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AUTHME_URL/admin/realms/$REALM_NAME/users" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "'$email'",
        "email": "'$email'",
        "enabled": true,
        "firstName": "'$first_name'",
        "lastName": "'$last_name'"
      }')
    
    HTTP_CODE=$(echo "$USER_RESPONSE" | tail -n 1)
    BODY=$(echo "$USER_RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "201" ]; then
        USER_ID=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null)
        
        if [ -z "$USER_ID" ]; then
            # Extract from Location header
            USER_ID=$(curl -s -I -X POST "$AUTHME_URL/admin/realms/$REALM_NAME/users" \
              -H "Authorization: Bearer $ADMIN_TOKEN" \
              -H "Content-Type: application/json" \
              -d '{"username": "'$email'"}' | grep -i "location" | awk -F'/' '{print $NF}' | tr -d '\r')
        fi
        
        # Assign role
        if [ -n "$USER_ID" ]; then
            ROLE_ID=$(curl -s -X GET "$AUTHME_URL/admin/realms/$REALM_NAME/roles/$role_name" \
              -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id // empty')
            
            if [ -n "$ROLE_ID" ]; then
                curl -s -X POST "$AUTHME_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/realm" \
                  -H "Authorization: Bearer $ADMIN_TOKEN" \
                  -H "Content-Type: application/json" \
                  -d '[{"id":"'$ROLE_ID'","name":"'$role_name'"}]' > /dev/null 2>&1
            fi
        fi
        
        echo -e "  ${GREEN}✓ $email (role: $role_name)${NC}"
    else
        echo -e "  ${YELLOW}⚠ User $email may already exist${NC}"
    fi
}

# Create Users
echo -e "${YELLOW}Creating test users...${NC}"
create_user "admin@test.com" "Admin123!" "crm-admin" "Admin" "User"
create_user "manager@test.com" "Manager123!" "crm-manager" "Manager" "User"
create_user "agent@test.com" "Agent123!" "crm-agent" "Agent" "User"
echo ""

# Verify configuration
echo -e "${YELLOW}Verifying configuration...${NC}"

# Test OIDC Discovery
echo "  Testing OIDC Discovery endpoint..."
if curl -s -f "$AUTHME_URL/realms/$REALM_NAME/.well-known/openid-configuration" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ OIDC Discovery working${NC}"
else
    echo -e "  ${RED}✗ OIDC Discovery failed${NC}"
fi

# Test JWT Keys
echo "  Testing JWT Keys endpoint..."
if curl -s -f "$AUTHME_URL/realms/$REALM_NAME/protocol/openid-connect/certs" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ JWT Keys endpoint working${NC}"
else
    echo -e "  ${RED}✗ JWT Keys endpoint failed${NC}"
fi

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}AuthMe Dev Setup Complete!${NC}"
echo -e "${GREEN}=====================================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo "1. Update .env.dev with AUTHME_CLIENT_SECRET from above"
echo "2. Start the dev environment: docker-compose -f docker-compose.dev-full.yml up -d"
echo "3. Test login at http://localhost:5173 (admin portal)"
echo "4. Test credentials:"
echo "   - admin@test.com / Admin123!"
echo "   - manager@test.com / Manager123!"
echo "   - agent@test.com / Agent123!"
echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo "  Realm: $REALM_NAME"
echo "  URL: $AUTHME_URL"
echo "  Clients: admin-portal, agent-portal, mobile, crm-backend"
echo "  Roles: crm-admin, crm-manager, crm-agent"
echo "  Users: admin@test.com, manager@test.com, agent@test.com"
echo ""

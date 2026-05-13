import os
from keycloak import KeycloakAdmin
from keycloak.exceptions import KeycloakPostError

# Keycloak Config from env or defaults
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_ADMIN_USER = os.getenv("KC_BOOTSTRAP_ADMIN_USERNAME", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KC_BOOTSTRAP_ADMIN_PASSWORD", "admin")
REALM_NAME = os.getenv("KEYCLOAK_REALM", "chefai")
CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "chefai-app")

def setup_keycloak():
    print(f"Connecting to Keycloak at {KEYCLOAK_URL}...")
    
    # 1. Connect to master to check/create the realm
    master_admin = KeycloakAdmin(
        server_url=KEYCLOAK_URL,
        username=KEYCLOAK_ADMIN_USER,
        password=KEYCLOAK_ADMIN_PASSWORD,
        realm_name="master",
        verify=True
    )

    # Check if realm exists
    realms = master_admin.get_realms()
    realm_exists = any(r['realm'] == REALM_NAME for r in realms)

    if not realm_exists:
        try:
            master_admin.create_realm(payload={"realm": REALM_NAME, "enabled": True})
            print(f"Realm '{REALM_NAME}' created.")
        except Exception as e:
            print(f"Error creating realm: {e}")
    else:
        print(f"Realm '{REALM_NAME}' already exists.")

    # 2. Connect to the NEW realm to create the client
    realm_admin = KeycloakAdmin(
        server_url=KEYCLOAK_URL,
        username=KEYCLOAK_ADMIN_USER,
        password=KEYCLOAK_ADMIN_PASSWORD,
        realm_name=REALM_NAME,
        verify=True
    )

    # 3. Create Client if it doesn't exist
    try:
        clients = realm_admin.get_clients()
        if not any(c['clientId'] == CLIENT_ID for c in clients):
            realm_admin.create_client(payload={
                "clientId": CLIENT_ID,
                "publicClient": True,
                "directAccessGrantsEnabled": True,
                "enabled": True,
                "redirectUris": ["*"],
                "webOrigins": ["*"]
            })
            print(f"Client '{CLIENT_ID}' created in realm '{REALM_NAME}'.")
        else:
            print(f"Client '{CLIENT_ID}' already exists in realm '{REALM_NAME}'.")
    except Exception as e:
        print(f"Error creating client: {e}")


if __name__ == "__main__":
    setup_keycloak()

"""
Delinea Secret Server API Example: Basic CRUD Operations
Author: Dominic M. Hoang

Demonstrates Create, Read, Update, Delete operations on secrets.
"""

import os
import sys

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))

from delinea_client import DelineaSecretServerClient


def main():
    """Demonstrate basic CRUD operations with Delinea Secret Server"""

    # Initialize client in mock mode (no live server required)
    client = DelineaSecretServerClient(mock_mode=True)

    print("=" * 60)
    print("Delinea Secret Server - Basic CRUD Operations Demo")
    print("=" * 60)

    # 1. CREATE: Create a new secret
    print("\n1. CREATE: Adding a new secret...")
    new_secret = client.create_secret(
        name="demo-database-credential",
        template_id=3,  # Database (SQL Server) template
        folder_id=3,    # Databases folder
        fields={
            "Server": "demo-sql.example.com",
            "Database": "production",
            "Username": "app_user",
            "Password": "Demo-P@ssw0rd-123!"
        }
    )
    print(f"   Created: {new_secret.name} (ID: {new_secret.id})")

    # 2. READ: Retrieve the secret
    print("\n2. READ: Retrieving the secret...")
    retrieved = client.get_secret(new_secret.id)
    print(f"   Name: {retrieved.name}")
    print(f"   Template: {retrieved.template_name}")
    print(f"   Folder: {retrieved.folder_path}")
    print(f"   Fields:")
    for field in retrieved.fields:
        value = "********" if field.is_password else field.value
        print(f"      - {field.field_name}: {value}")

    # 3. UPDATE: Update a field
    print("\n3. UPDATE: Updating the password field...")
    client.update_secret_field(
        secret_id=new_secret.id,
        field_name="Password",
        value="Updated-P@ssw0rd-456!"
    )
    print("   Password updated successfully")

    # Verify the update
    updated = client.get_secret(new_secret.id)
    password_field = next((f for f in updated.fields if f.field_name == "Password"), None)
    if password_field:
        print(f"   New password (masked): ********")

    # 4. LIST: Search for secrets
    print("\n4. LIST: Searching for secrets containing 'demo'...")
    results = client.search_secrets(search_text="demo")
    print(f"   Found {len(results)} secrets:")
    for secret in results:
        print(f"      - {secret.name} (ID: {secret.id})")

    # 5. DELETE: Delete the secret
    print("\n5. DELETE: Removing the demo secret...")
    client.delete_secret(new_secret.id)
    print(f"   Deleted secret ID: {new_secret.id}")

    # Verify deletion
    remaining = client.search_secrets(search_text="demo-database-credential")
    print(f"   Remaining secrets with 'demo-database-credential': {len(remaining)}")

    print("\n" + "=" * 60)
    print("CRUD operations completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()

"""
Delinea Secret Server API Example: Folder Management
Author: Dominic M. Hoang

Demonstrates folder hierarchy operations in Secret Server.
"""

import os
import sys

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))

from delinea_client import DelineaSecretServerClient


def main():
    """Demonstrate folder management with Delinea Secret Server"""

    # Initialize client in mock mode
    client = DelineaSecretServerClient(mock_mode=True)

    print("=" * 60)
    print("Delinea Secret Server - Folder Management Demo")
    print("=" * 60)

    # 1. List all folders
    print("\n1. List all folders:")
    folders = client.list_folders()
    for folder in folders:
        print(f"   [{folder.id}] {folder.folder_path}")

    # 2. List folders under a specific parent
    print("\n2. List folders under 'IT Infrastructure' (ID: 2):")
    subfolders = client.list_folders(parent_folder_id=2)
    for folder in subfolders:
        print(f"   [{folder.id}] {folder.name}")

    # 3. Create a new folder
    print("\n3. Create a new folder 'DevOps' under IT Infrastructure:")
    new_folder = client.create_folder(
        name="DevOps",
        parent_folder_id=2,
        inherit_permissions=True
    )
    print(f"   Created: {new_folder.name} (ID: {new_folder.id})")
    print(f"   Path: {new_folder.folder_path}")

    # 4. Create subfolder
    print("\n4. Create subfolder 'CI-CD' under DevOps:")
    cicd_folder = client.create_folder(
        name="CI-CD",
        parent_folder_id=new_folder.id,
        inherit_permissions=True
    )
    print(f"   Created: {cicd_folder.folder_path}")

    # 5. Create a secret in the new folder
    print("\n5. Create a secret in the CI-CD folder:")
    secret = client.create_secret(
        name="github-actions-token",
        template_id=5,  # API Key template
        folder_id=cicd_folder.id,
        fields={
            "Service Name": "GitHub Actions",
            "API Key": "ghp_xxxxxxxxxxxxxxxxxxxx",
            "API Secret": "",
            "Endpoint URL": "https://api.github.com"
        }
    )
    print(f"   Created: {secret.name} in folder ID {cicd_folder.id}")

    # 6. List secrets in folder
    print("\n6. Search secrets in the hierarchy:")
    all_secrets = client.search_secrets()
    print(f"   Total secrets in system: {len(all_secrets)}")

    # Show folder structure
    print("\n7. Current folder structure:")
    print_folder_tree(client)

    print("\n" + "=" * 60)
    print("Folder management demo completed!")
    print("=" * 60)


def print_folder_tree(client: DelineaSecretServerClient, parent_id=None, indent=0):
    """Print folder tree recursively"""
    folders = client.list_folders(parent_folder_id=parent_id)
    for folder in folders:
        prefix = "   " + "  " * indent + "|-"
        print(f"{prefix} {folder.name}/")

        # Get secrets in this folder
        secrets = client.search_secrets(folder_id=folder.id)
        for secret in secrets:
            if secret.folder_id == folder.id:
                secret_prefix = "   " + "  " * (indent + 1) + "|-"
                print(f"{secret_prefix} [secret] {secret.name}")


if __name__ == "__main__":
    main()

"""
Delinea Secret Server Python Client
Author: Dominic M. Hoang
Version: 1.0

Comprehensive client for Delinea Secret Server (Cloud and On-Premises)
with OAuth2 authentication, CRUD operations, and mock mode for demos.
"""

import os
import sys
import json
import logging
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
console = Console()


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class SecretField:
    """Represents a field within a secret"""
    field_id: int
    field_name: str
    slug: str
    value: str
    is_password: bool = False
    is_notes: bool = False


@dataclass
class Secret:
    """Represents a Delinea Secret Server secret"""
    id: int
    name: str
    folder_id: int
    template_id: int
    template_name: str
    fields: List[SecretField] = field(default_factory=list)
    folder_path: str = ""
    active: bool = True
    checked_out: bool = False
    last_password_change: Optional[datetime] = None
    created: Optional[datetime] = None

    def get_field(self, field_name: str) -> Optional[str]:
        """Get field value by name"""
        for f in self.fields:
            if f.field_name.lower() == field_name.lower() or f.slug.lower() == field_name.lower():
                return f.value
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for export"""
        return {
            "id": self.id,
            "name": self.name,
            "folder_id": self.folder_id,
            "folder_path": self.folder_path,
            "template_id": self.template_id,
            "template_name": self.template_name,
            "fields": {f.field_name: f.value for f in self.fields if not f.is_password},
            "active": self.active
        }


@dataclass
class Folder:
    """Represents a folder in Secret Server"""
    id: int
    name: str
    parent_folder_id: Optional[int]
    folder_path: str
    inherit_permissions: bool = True
    inherit_secret_policy: bool = True


@dataclass
class SecretTemplate:
    """Represents a secret template"""
    id: int
    name: str
    fields: List[Dict[str, Any]] = field(default_factory=list)


# ============================================================================
# Mock Data Store (for demo mode)
# ============================================================================

class MockDataStore:
    """In-memory data store for mock mode"""

    def __init__(self):
        self.secrets: Dict[int, Dict] = {}
        self.folders: Dict[int, Dict] = {}
        self.templates: Dict[int, Dict] = {}
        self._next_secret_id = 1
        self._next_folder_id = 1
        self._initialize_mock_data()

    def _initialize_mock_data(self):
        """Initialize with sample data"""
        # Templates
        self.templates = {
            1: {"id": 1, "name": "Windows Account", "fields": [
                {"name": "Machine", "slug": "machine", "isPassword": False},
                {"name": "Username", "slug": "username", "isPassword": False},
                {"name": "Password", "slug": "password", "isPassword": True},
                {"name": "Notes", "slug": "notes", "isPassword": False, "isNotes": True}
            ]},
            2: {"id": 2, "name": "Unix Account (SSH)", "fields": [
                {"name": "Machine", "slug": "machine", "isPassword": False},
                {"name": "Username", "slug": "username", "isPassword": False},
                {"name": "Password", "slug": "password", "isPassword": True},
                {"name": "Private Key", "slug": "private-key", "isPassword": True},
                {"name": "Notes", "slug": "notes", "isPassword": False, "isNotes": True}
            ]},
            3: {"id": 3, "name": "Database (SQL Server)", "fields": [
                {"name": "Server", "slug": "server", "isPassword": False},
                {"name": "Database", "slug": "database", "isPassword": False},
                {"name": "Username", "slug": "username", "isPassword": False},
                {"name": "Password", "slug": "password", "isPassword": True}
            ]},
            4: {"id": 4, "name": "Web Password", "fields": [
                {"name": "URL", "slug": "url", "isPassword": False},
                {"name": "Username", "slug": "username", "isPassword": False},
                {"name": "Password", "slug": "password", "isPassword": True},
                {"name": "Notes", "slug": "notes", "isPassword": False, "isNotes": True}
            ]},
            5: {"id": 5, "name": "API Key", "fields": [
                {"name": "Service Name", "slug": "service-name", "isPassword": False},
                {"name": "API Key", "slug": "api-key", "isPassword": True},
                {"name": "API Secret", "slug": "api-secret", "isPassword": True},
                {"name": "Endpoint URL", "slug": "endpoint-url", "isPassword": False}
            ]}
        }

        # Folders
        self.folders = {
            1: {"id": 1, "folderName": "Personal Folders", "parentFolderId": None, "folderPath": "\\Personal Folders"},
            2: {"id": 2, "folderName": "IT Infrastructure", "parentFolderId": 1, "folderPath": "\\Personal Folders\\IT Infrastructure"},
            3: {"id": 3, "folderName": "Databases", "parentFolderId": 2, "folderPath": "\\Personal Folders\\IT Infrastructure\\Databases"},
            4: {"id": 4, "folderName": "Linux Servers", "parentFolderId": 2, "folderPath": "\\Personal Folders\\IT Infrastructure\\Linux Servers"},
            5: {"id": 5, "folderName": "Windows Servers", "parentFolderId": 2, "folderPath": "\\Personal Folders\\IT Infrastructure\\Windows Servers"},
            6: {"id": 6, "folderName": "Cloud Services", "parentFolderId": 1, "folderPath": "\\Personal Folders\\Cloud Services"},
            7: {"id": 7, "folderName": "AWS", "parentFolderId": 6, "folderPath": "\\Personal Folders\\Cloud Services\\AWS"},
            8: {"id": 8, "folderName": "Azure", "parentFolderId": 6, "folderPath": "\\Personal Folders\\Cloud Services\\Azure"}
        }
        self._next_folder_id = 9

        # Sample secrets
        self.secrets = {
            1: {
                "id": 1, "name": "prod-db-admin", "folderId": 3,
                "secretTemplateId": 3, "secretTemplateName": "Database (SQL Server)",
                "folderPath": "\\Personal Folders\\IT Infrastructure\\Databases",
                "active": True, "checkedOut": False,
                "items": [
                    {"fieldId": 1, "fieldName": "Server", "slug": "server", "itemValue": "prod-sql-01.corp.local", "isPassword": False},
                    {"fieldId": 2, "fieldName": "Database", "slug": "database", "itemValue": "production", "isPassword": False},
                    {"fieldId": 3, "fieldName": "Username", "slug": "username", "itemValue": "sa_admin", "isPassword": False},
                    {"fieldId": 4, "fieldName": "Password", "slug": "password", "itemValue": "Pr0d-S3cur3-P@ss!", "isPassword": True}
                ]
            },
            2: {
                "id": 2, "name": "linux-root-web01", "folderId": 4,
                "secretTemplateId": 2, "secretTemplateName": "Unix Account (SSH)",
                "folderPath": "\\Personal Folders\\IT Infrastructure\\Linux Servers",
                "active": True, "checkedOut": False,
                "items": [
                    {"fieldId": 1, "fieldName": "Machine", "slug": "machine", "itemValue": "web01.corp.local", "isPassword": False},
                    {"fieldId": 2, "fieldName": "Username", "slug": "username", "itemValue": "root", "isPassword": False},
                    {"fieldId": 3, "fieldName": "Password", "slug": "password", "itemValue": "L1nux-R00t-2024!", "isPassword": True},
                    {"fieldId": 4, "fieldName": "Private Key", "slug": "private-key", "itemValue": "", "isPassword": True},
                    {"fieldId": 5, "fieldName": "Notes", "slug": "notes", "itemValue": "Primary web server", "isPassword": False, "isNotes": True}
                ]
            },
            3: {
                "id": 3, "name": "aws-iam-deployment", "folderId": 7,
                "secretTemplateId": 5, "secretTemplateName": "API Key",
                "folderPath": "\\Personal Folders\\Cloud Services\\AWS",
                "active": True, "checkedOut": False,
                "items": [
                    {"fieldId": 1, "fieldName": "Service Name", "slug": "service-name", "itemValue": "AWS IAM - CI/CD Deployment", "isPassword": False},
                    {"fieldId": 2, "fieldName": "API Key", "slug": "api-key", "itemValue": "AKIAIOSFODNN7EXAMPLE", "isPassword": True},
                    {"fieldId": 3, "fieldName": "API Secret", "slug": "api-secret", "itemValue": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", "isPassword": True},
                    {"fieldId": 4, "fieldName": "Endpoint URL", "slug": "endpoint-url", "itemValue": "https://iam.amazonaws.com", "isPassword": False}
                ]
            },
            4: {
                "id": 4, "name": "dc01-admin", "folderId": 5,
                "secretTemplateId": 1, "secretTemplateName": "Windows Account",
                "folderPath": "\\Personal Folders\\IT Infrastructure\\Windows Servers",
                "active": True, "checkedOut": False,
                "items": [
                    {"fieldId": 1, "fieldName": "Machine", "slug": "machine", "itemValue": "dc01.corp.local", "isPassword": False},
                    {"fieldId": 2, "fieldName": "Username", "slug": "username", "itemValue": "Administrator", "isPassword": False},
                    {"fieldId": 3, "fieldName": "Password", "slug": "password", "itemValue": "DC-Adm1n-2024!", "isPassword": True},
                    {"fieldId": 4, "fieldName": "Notes", "slug": "notes", "itemValue": "Primary Domain Controller", "isPassword": False, "isNotes": True}
                ]
            }
        }
        self._next_secret_id = 5


# Global mock store
_mock_store = MockDataStore()


# ============================================================================
# Delinea Secret Server Client
# ============================================================================

class DelineaSecretServerClient:
    """
    Client for Delinea Secret Server (Cloud and On-Premises)

    Supports:
    - OAuth2 authentication with token caching
    - CRUD operations for secrets
    - Folder management
    - Template management
    - Mock mode for demonstrations
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        domain: Optional[str] = None,
        mock_mode: bool = True
    ):
        """
        Initialize Secret Server client

        Args:
            base_url: Secret Server URL (e.g., https://your-tenant.secretservercloud.com)
            username: API username or user account
            password: Password for authentication
            domain: Domain for domain accounts (optional)
            mock_mode: Use mock data instead of live server (default: True)
        """
        from config import get_settings
        settings = get_settings()

        self.base_url = (base_url or settings.delinea.url).rstrip("/")
        self.username = username or settings.delinea.username
        self.password = password or settings.delinea.password
        self.domain = domain or settings.delinea.domain
        self.mock_mode = mock_mode if mock_mode is not None else settings.delinea.mock_mode

        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._session = None

        if not self.mock_mode:
            try:
                import requests
                self._session = requests.Session()
            except ImportError:
                logger.warning("requests library not installed, falling back to mock mode")
                self.mock_mode = True

        logger.info(f"Delinea client initialized (mock_mode={self.mock_mode})")

    # ========================================================================
    # Authentication
    # ========================================================================

    def _get_token(self) -> str:
        """Get OAuth2 access token (with caching)"""
        if self.mock_mode:
            return "mock-token-12345"

        # Check if token is still valid
        if self._token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._token

        token_url = f"{self.base_url}/oauth2/token"
        data = {
            "grant_type": "password",
            "username": self.username,
            "password": self.password
        }

        if self.domain:
            data["domain"] = self.domain

        response = self._session.post(token_url, data=data)
        response.raise_for_status()

        result = response.json()
        self._token = result["access_token"]
        expires_in = result.get("expires_in", 3600)
        self._token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)

        logger.info("Successfully authenticated to Secret Server")
        return self._token

    def _api_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """Make authenticated API request"""
        if self.mock_mode:
            return self._mock_api_request(method, endpoint, data, params)

        headers = {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json"
        }

        url = f"{self.base_url}/api/v1{endpoint}"

        response = self._session.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            params=params
        )
        response.raise_for_status()
        return response.json() if response.text else {}

    def _mock_api_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """Handle mock API requests"""
        global _mock_store

        # Secrets endpoints
        if endpoint.startswith("/secrets"):
            if method == "GET":
                if endpoint == "/secrets":
                    # Search/list secrets
                    search_text = params.get("filter.searchText", "") if params else ""
                    folder_id = params.get("filter.folderId") if params else None
                    results = []
                    for secret in _mock_store.secrets.values():
                        if search_text.lower() in secret["name"].lower():
                            if folder_id is None or secret["folderId"] == int(folder_id):
                                results.append(secret)
                    return {"records": results, "total": len(results)}
                else:
                    # Get specific secret
                    secret_id = int(endpoint.split("/")[-1])
                    if secret_id in _mock_store.secrets:
                        return _mock_store.secrets[secret_id]
                    raise ValueError(f"Secret {secret_id} not found")

            elif method == "POST":
                # Create secret
                new_id = _mock_store._next_secret_id
                _mock_store._next_secret_id += 1
                template = _mock_store.templates.get(data.get("secretTemplateId", 1), {})
                folder = _mock_store.folders.get(data.get("folderId", 1), {})
                new_secret = {
                    "id": new_id,
                    "name": data.get("name", "New Secret"),
                    "folderId": data.get("folderId", 1),
                    "secretTemplateId": data.get("secretTemplateId", 1),
                    "secretTemplateName": template.get("name", "Unknown"),
                    "folderPath": folder.get("folderPath", ""),
                    "active": True,
                    "checkedOut": False,
                    "items": data.get("items", [])
                }
                _mock_store.secrets[new_id] = new_secret
                return new_secret

            elif method == "DELETE":
                secret_id = int(endpoint.split("/")[-1])
                if secret_id in _mock_store.secrets:
                    del _mock_store.secrets[secret_id]
                    return {}
                raise ValueError(f"Secret {secret_id} not found")

        # Folders endpoints
        elif endpoint.startswith("/folders"):
            if method == "GET":
                if endpoint == "/folders":
                    parent_id = params.get("filter.parentFolderId") if params else None
                    results = []
                    for folder in _mock_store.folders.values():
                        if parent_id is None or folder.get("parentFolderId") == int(parent_id):
                            results.append(folder)
                    return {"records": results}
                else:
                    folder_id = int(endpoint.split("/")[-1])
                    if folder_id in _mock_store.folders:
                        return _mock_store.folders[folder_id]
                    raise ValueError(f"Folder {folder_id} not found")

            elif method == "POST":
                new_id = _mock_store._next_folder_id
                _mock_store._next_folder_id += 1
                parent = _mock_store.folders.get(data.get("parentFolderId", 1), {})
                parent_path = parent.get("folderPath", "")
                new_folder = {
                    "id": new_id,
                    "folderName": data.get("folderName", "New Folder"),
                    "parentFolderId": data.get("parentFolderId"),
                    "folderPath": f"{parent_path}\\{data.get('folderName', 'New Folder')}"
                }
                _mock_store.folders[new_id] = new_folder
                return new_folder

        # Templates endpoints
        elif endpoint.startswith("/secret-templates"):
            if method == "GET":
                if endpoint == "/secret-templates":
                    return {"records": list(_mock_store.templates.values())}
                else:
                    template_id = int(endpoint.split("/")[-1])
                    if template_id in _mock_store.templates:
                        return _mock_store.templates[template_id]
                    raise ValueError(f"Template {template_id} not found")

        return {}

    # ========================================================================
    # Secret Operations
    # ========================================================================

    def get_secret(self, secret_id: int) -> Secret:
        """
        Get secret by ID

        Args:
            secret_id: Secret ID

        Returns:
            Secret object
        """
        data = self._api_request("GET", f"/secrets/{secret_id}")
        return self._parse_secret(data)

    def search_secrets(
        self,
        search_text: str = "",
        folder_id: Optional[int] = None,
        include_subfolders: bool = True
    ) -> List[Secret]:
        """
        Search for secrets

        Args:
            search_text: Text to search for
            folder_id: Filter by folder ID
            include_subfolders: Include secrets from subfolders

        Returns:
            List of matching secrets
        """
        params = {
            "filter.searchText": search_text,
            "filter.includeSubFolders": include_subfolders
        }
        if folder_id:
            params["filter.folderId"] = folder_id

        response = self._api_request("GET", "/secrets", params=params)
        return [self._parse_secret(s) for s in response.get("records", [])]

    def create_secret(
        self,
        name: str,
        template_id: int,
        folder_id: int,
        fields: Dict[str, str]
    ) -> Secret:
        """
        Create a new secret

        Args:
            name: Secret name
            template_id: Template ID to use
            folder_id: Folder ID to create in
            fields: Field values {field_name: value}

        Returns:
            Created secret
        """
        items = [
            {"fieldName": k, "itemValue": v}
            for k, v in fields.items()
        ]

        data = {
            "name": name,
            "secretTemplateId": template_id,
            "folderId": folder_id,
            "items": items
        }

        response = self._api_request("POST", "/secrets", data=data)
        logger.info(f"Created secret: {name} (ID: {response.get('id')})")
        return self._parse_secret(response)

    def update_secret_field(
        self,
        secret_id: int,
        field_name: str,
        value: str
    ) -> None:
        """
        Update a specific field on a secret

        Args:
            secret_id: Secret ID
            field_name: Field name to update
            value: New value
        """
        if self.mock_mode:
            if secret_id in _mock_store.secrets:
                for item in _mock_store.secrets[secret_id]["items"]:
                    if item["fieldName"].lower() == field_name.lower():
                        item["itemValue"] = value
                        break
            return

        self._api_request(
            "PUT",
            f"/secrets/{secret_id}/fields/{field_name}",
            data={"value": value}
        )
        logger.info(f"Updated field {field_name} on secret {secret_id}")

    def delete_secret(self, secret_id: int) -> None:
        """
        Delete a secret

        Args:
            secret_id: Secret ID to delete
        """
        self._api_request("DELETE", f"/secrets/{secret_id}")
        logger.info(f"Deleted secret {secret_id}")

    # ========================================================================
    # Folder Operations
    # ========================================================================

    def list_folders(self, parent_folder_id: Optional[int] = None) -> List[Folder]:
        """
        List folders

        Args:
            parent_folder_id: Parent folder ID (None for all)

        Returns:
            List of folders
        """
        params = {}
        if parent_folder_id:
            params["filter.parentFolderId"] = parent_folder_id

        response = self._api_request("GET", "/folders", params=params)
        return [self._parse_folder(f) for f in response.get("records", [])]

    def create_folder(
        self,
        name: str,
        parent_folder_id: int,
        inherit_permissions: bool = True
    ) -> Folder:
        """
        Create a new folder

        Args:
            name: Folder name
            parent_folder_id: Parent folder ID
            inherit_permissions: Inherit permissions from parent

        Returns:
            Created folder
        """
        data = {
            "folderName": name,
            "parentFolderId": parent_folder_id,
            "inheritPermissions": inherit_permissions
        }

        response = self._api_request("POST", "/folders", data=data)
        logger.info(f"Created folder: {name}")
        return self._parse_folder(response)

    # ========================================================================
    # Template Operations
    # ========================================================================

    def list_templates(self) -> List[SecretTemplate]:
        """List available secret templates"""
        response = self._api_request("GET", "/secret-templates")
        return [
            SecretTemplate(
                id=t["id"],
                name=t["name"],
                fields=t.get("fields", [])
            )
            for t in response.get("records", [])
        ]

    def get_template(self, template_id: int) -> SecretTemplate:
        """Get template by ID"""
        response = self._api_request("GET", f"/secret-templates/{template_id}")
        return SecretTemplate(
            id=response["id"],
            name=response["name"],
            fields=response.get("fields", [])
        )

    # ========================================================================
    # Export for Migration
    # ========================================================================

    def export_all_secrets(
        self,
        folder_id: Optional[int] = None,
        include_subfolders: bool = True
    ) -> List[Dict]:
        """
        Export all secrets for migration

        Args:
            folder_id: Start folder (None for all)
            include_subfolders: Include secrets from subfolders

        Returns:
            List of secret dictionaries
        """
        secrets = self.search_secrets(
            folder_id=folder_id,
            include_subfolders=include_subfolders
        )

        exported = []
        for secret in secrets:
            exported.append({
                "id": secret.id,
                "name": secret.name,
                "folder_path": secret.folder_path,
                "template_name": secret.template_name,
                "fields": {
                    f.field_name: f.value
                    for f in secret.fields
                    if not f.is_password  # Don't export passwords in plain text by default
                },
                "active": secret.active
            })

        return exported

    # ========================================================================
    # Health Check
    # ========================================================================

    def health_check(self) -> Dict[str, Any]:
        """Check connection health"""
        try:
            if self.mock_mode:
                return {
                    "connected": True,
                    "authenticated": True,
                    "mode": "mock",
                    "secret_count": len(_mock_store.secrets),
                    "folder_count": len(_mock_store.folders),
                    "template_count": len(_mock_store.templates)
                }

            # Try to authenticate
            self._get_token()

            # Try to list templates (basic read operation)
            templates = self.list_templates()

            return {
                "connected": True,
                "authenticated": True,
                "mode": "live",
                "url": self.base_url,
                "template_count": len(templates)
            }

        except Exception as e:
            return {
                "connected": False,
                "authenticated": False,
                "error": str(e),
                "url": self.base_url
            }

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _parse_secret(self, data: Dict) -> Secret:
        """Parse API response into Secret object"""
        fields = []
        for item in data.get("items", []):
            fields.append(SecretField(
                field_id=item.get("fieldId", 0),
                field_name=item.get("fieldName", ""),
                slug=item.get("slug", ""),
                value=item.get("itemValue", ""),
                is_password=item.get("isPassword", False),
                is_notes=item.get("isNotes", False)
            ))

        return Secret(
            id=data.get("id", 0),
            name=data.get("name", ""),
            folder_id=data.get("folderId", 0),
            template_id=data.get("secretTemplateId", 0),
            template_name=data.get("secretTemplateName", ""),
            fields=fields,
            folder_path=data.get("folderPath", ""),
            active=data.get("active", True),
            checked_out=data.get("checkedOut", False)
        )

    def _parse_folder(self, data: Dict) -> Folder:
        """Parse API response into Folder object"""
        return Folder(
            id=data.get("id", 0),
            name=data.get("folderName", ""),
            parent_folder_id=data.get("parentFolderId"),
            folder_path=data.get("folderPath", ""),
            inherit_permissions=data.get("inheritPermissions", True),
            inherit_secret_policy=data.get("inheritSecretPolicy", True)
        )


# ============================================================================
# CLI Interface
# ============================================================================

@click.group()
@click.option("--mock/--no-mock", default=True, help="Use mock mode (default: True)")
@click.pass_context
def cli(ctx, mock):
    """Delinea Secret Server CLI - Multi-Vendor PAM Client"""
    ctx.ensure_object(dict)
    ctx.obj["mock_mode"] = mock


@cli.command()
@click.pass_context
def status(ctx):
    """Check Secret Server connection status"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])
    health = client.health_check()

    if health["connected"]:
        console.print(Panel.fit(
            f"[green]Connected to Secret Server[/green]\n"
            f"Mode: {health.get('mode', 'unknown')}\n"
            f"Secrets: {health.get('secret_count', 'N/A')}\n"
            f"Folders: {health.get('folder_count', 'N/A')}\n"
            f"Templates: {health.get('template_count', 'N/A')}",
            title="Health Check",
            border_style="green"
        ))
    else:
        console.print(Panel.fit(
            f"[red]Not Connected[/red]\n"
            f"Error: {health.get('error', 'Unknown')}",
            title="Health Check",
            border_style="red"
        ))


@cli.command("list")
@click.option("--search", "-s", default="", help="Search text")
@click.option("--folder", "-f", type=int, help="Folder ID")
@click.pass_context
def list_secrets(ctx, search, folder):
    """List/search secrets"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])
    secrets = client.search_secrets(search_text=search, folder_id=folder)

    if secrets:
        table = Table(title="Secrets", show_header=True, header_style="bold cyan")
        table.add_column("ID", style="cyan", width=6)
        table.add_column("Name", style="green")
        table.add_column("Folder", style="yellow")
        table.add_column("Template", style="magenta")

        for s in secrets:
            table.add_row(
                str(s.id),
                s.name,
                s.folder_path,
                s.template_name
            )

        console.print(table)
    else:
        console.print("[yellow]No secrets found[/yellow]")


@cli.command("get")
@click.argument("secret_id", type=int)
@click.option("--show-password", "-p", is_flag=True, help="Show password values")
@click.pass_context
def get_secret(ctx, secret_id, show_password):
    """Get a secret by ID"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])

    try:
        secret = client.get_secret(secret_id)

        table = Table(title=f"Secret: {secret.name} (ID: {secret.id})", show_header=True)
        table.add_column("Field", style="cyan")
        table.add_column("Value", style="green")

        for field in secret.fields:
            value = field.value
            if field.is_password and not show_password:
                value = "********"
            table.add_row(field.field_name, value)

        console.print(table)
        console.print(f"\n[dim]Folder: {secret.folder_path}[/dim]")
        console.print(f"[dim]Template: {secret.template_name}[/dim]")

        if show_password:
            console.print("\n[red]Warning: Passwords displayed in clear text![/red]")

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@cli.command("create")
@click.option("--name", "-n", required=True, help="Secret name")
@click.option("--template", "-t", type=int, required=True, help="Template ID")
@click.option("--folder", "-f", type=int, required=True, help="Folder ID")
@click.option("--field", "-d", multiple=True, help="Field values (field=value)")
@click.pass_context
def create_secret(ctx, name, template, folder, field):
    """Create a new secret"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])

    fields = {}
    for f in field:
        if "=" in f:
            k, v = f.split("=", 1)
            fields[k] = v

    if not fields:
        console.print("[red]Error: No fields provided. Use -d field=value[/red]")
        sys.exit(1)

    try:
        secret = client.create_secret(
            name=name,
            template_id=template,
            folder_id=folder,
            fields=fields
        )
        console.print(f"[green]Created secret: {secret.name} (ID: {secret.id})[/green]")

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@cli.command("delete")
@click.argument("secret_id", type=int)
@click.option("--confirm", "-y", is_flag=True, help="Skip confirmation")
@click.pass_context
def delete_secret(ctx, secret_id, confirm):
    """Delete a secret"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])

    if not confirm:
        if not click.confirm(f"Delete secret {secret_id}?"):
            console.print("[yellow]Cancelled[/yellow]")
            return

    try:
        client.delete_secret(secret_id)
        console.print(f"[green]Deleted secret {secret_id}[/green]")

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@cli.command("folders")
@click.option("--parent", "-p", type=int, help="Parent folder ID")
@click.pass_context
def list_folders(ctx, parent):
    """List folders"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])
    folders = client.list_folders(parent_folder_id=parent)

    table = Table(title="Folders", show_header=True, header_style="bold cyan")
    table.add_column("ID", style="cyan", width=6)
    table.add_column("Name", style="green")
    table.add_column("Path", style="yellow")

    for f in folders:
        table.add_row(str(f.id), f.name, f.folder_path)

    console.print(table)


@cli.command("templates")
@click.pass_context
def list_templates(ctx):
    """List available secret templates"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])
    templates = client.list_templates()

    table = Table(title="Secret Templates", show_header=True, header_style="bold cyan")
    table.add_column("ID", style="cyan", width=6)
    table.add_column("Name", style="green")

    for t in templates:
        table.add_row(str(t.id), t.name)

    console.print(table)


@cli.command("export")
@click.option("--folder", "-f", type=int, help="Folder ID to export from")
@click.option("--output", "-o", help="Output file (JSON)")
@click.pass_context
def export_secrets(ctx, folder, output):
    """Export secrets for migration"""
    client = DelineaSecretServerClient(mock_mode=ctx.obj["mock_mode"])

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        progress.add_task("Exporting secrets...", total=None)
        exported = client.export_all_secrets(folder_id=folder)

    if output:
        with open(output, "w") as f:
            json.dump(exported, f, indent=2, default=str)
        console.print(f"[green]Exported {len(exported)} secrets to {output}[/green]")
    else:
        console.print(json.dumps(exported, indent=2, default=str))


@cli.command("demo")
@click.pass_context
def demo(ctx):
    """Run interactive demo showing capabilities"""
    client = DelineaSecretServerClient(mock_mode=True)

    console.print(Panel.fit(
        "[bold cyan]Delinea Secret Server Client Demo[/bold cyan]\n\n"
        "This demo showcases the Delinea Secret Server Python client\n"
        "capabilities using mock data (no live server required).",
        title="PAM Multi-Vendor Lab",
        border_style="cyan"
    ))

    console.print("\n[bold]1. Health Check[/bold]")
    health = client.health_check()
    console.print(f"   Status: [green]Connected[/green] (Mode: {health['mode']})")
    console.print(f"   Secrets: {health['secret_count']}, Folders: {health['folder_count']}")

    console.print("\n[bold]2. List Secrets[/bold]")
    secrets = client.search_secrets()
    for s in secrets[:3]:
        console.print(f"   - {s.name} ({s.template_name})")

    console.print("\n[bold]3. Get Secret Details[/bold]")
    secret = client.get_secret(1)
    console.print(f"   Name: {secret.name}")
    console.print(f"   Template: {secret.template_name}")
    console.print(f"   Fields: {[f.field_name for f in secret.fields]}")

    console.print("\n[bold]4. Create New Secret[/bold]")
    new_secret = client.create_secret(
        name="demo-api-key",
        template_id=5,
        folder_id=7,
        fields={
            "Service Name": "Demo Service",
            "API Key": "demo-key-12345",
            "API Secret": "demo-secret-67890",
            "Endpoint URL": "https://api.example.com"
        }
    )
    console.print(f"   Created: {new_secret.name} (ID: {new_secret.id})")

    console.print("\n[bold]5. List Folders[/bold]")
    folders = client.list_folders()
    for f in folders[:3]:
        console.print(f"   - {f.folder_path}")

    console.print("\n[bold]6. List Templates[/bold]")
    templates = client.list_templates()
    for t in templates[:3]:
        console.print(f"   - {t.name} (ID: {t.id})")

    console.print("\n[green]Demo complete![/green]")
    console.print("\n[dim]Run 'python delinea_client.py --help' for all available commands[/dim]")


if __name__ == "__main__":
    cli()

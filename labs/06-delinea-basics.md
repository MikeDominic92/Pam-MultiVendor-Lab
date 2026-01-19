# Lab 06: Delinea Secret Server Basics

## Overview

This hands-on lab introduces you to Delinea Secret Server (DSS), a privileged account management (PAM) solution that secures and manages sensitive credentials. You'll learn how to connect to Secret Server, manage secrets, organize them in folders, and understand how Delinea's concepts relate to HashiCorp Vault.

By the end of this lab, you'll be comfortable with the fundamental operations needed to integrate Delinea Secret Server into your infrastructure.

## Prerequisites

Before starting this lab, ensure you have:

* Python 3.10 or higher installed
* The Delinea client scripts installed in the `scripts/` directory
* Access to the `delinea_client.py` script with mock mode enabled
* A terminal or command prompt ready for execution
* Basic familiarity with PAM concepts from Lab 01

## Learning Objectives

By completing this lab, you will be able to:

1. Connect to Delinea Secret Server using the Python client in mock mode
2. List and search for secrets using various filtering options
3. Retrieve detailed information about secrets including all field values
4. Create new secrets with appropriate metadata and field values
5. Organize secrets using folders and understand the folder hierarchy
6. Explore secret templates and their role in standardizing secret structures
7. Export secrets for migration or auditing purposes

## Lab Duration

Approximately 30 minutes

## Exercises

### Exercise 1: Connect to Secret Server (Mock Mode)

In this exercise, you'll establish a connection to Secret Server using mock mode, which simulates the API without requiring actual credentials.

**Objective:** Verify that the Delinea client is properly configured and can connect to Secret Server.

**Steps:**

1. Open your terminal and navigate to the lab directory:
   ```
   cd C:\Users\jae2j\projects\IAM-Portfolio\pam-vault-lab
   ```

2. Test the basic connection to Secret Server in mock mode:
   ```
   python scripts/delinea_client.py --mock status
   ```

3. Expected output should show connection status and version information.

4. Try getting server information:
   ```
   python scripts/delinea_client.py --mock info
   ```

**Verification:**
* The script returns without errors
* Mock mode is confirmed in the output
* Server information is displayed (even if simulated)

**Key Concepts:**
* Mock mode allows testing without accessing a real Secret Server instance
* Connection configuration is typically stored in environment variables or a config file
* The client abstracts away API complexity for common operations

---

### Exercise 2: List and Search Secrets

In this exercise, you'll learn how to discover and search for secrets stored in Secret Server.

**Objective:** Understand how secrets are organized and how to locate them using search functionality.

**Steps:**

1. List all secrets available in the system:
   ```
   python scripts/delinea_client.py --mock list-secrets
   ```

2. List secrets with more verbose output:
   ```
   python scripts/delinea_client.py --mock list-secrets --verbose
   ```

3. Search for secrets by name (example: find all database secrets):
   ```
   python scripts/delinea_client.py --mock search-secrets --query "database"
   ```

4. Search for secrets by type:
   ```
   python scripts/delinea_client.py --mock search-secrets --type "Active Directory"
   ```

5. List secrets in a specific folder:
   ```
   python scripts/delinea_client.py --mock list-secrets --folder "Infrastructure"
   ```

**Verification:**
* The command returns a list of secrets with IDs and names
* Search filtering works and narrows results appropriately
* Folder filtering returns only secrets in the specified folder

**Key Concepts:**
* Secrets are indexed by ID and name in Secret Server
* Search supports filtering by name and type
* Folder organization helps manage large numbers of secrets
* Metadata like creation date and last accessed time is available

---

### Exercise 3: Get Secret Details

In this exercise, you'll retrieve detailed information about a specific secret and its field values.

**Objective:** Understand the structure of secrets and how to access sensitive field values.

**Steps:**

1. Get details about a specific secret by ID (use an ID from Exercise 2):
   ```
   python scripts/delinea_client.py --mock get-secret --id 1
   ```

2. View the secret with all field values expanded:
   ```
   python scripts/delinea_client.py --mock get-secret --id 1 --show-values
   ```

3. Get a specific field value from the secret:
   ```
   python scripts/delinea_client.py --mock get-secret --id 1 --field "password"
   ```

4. Retrieve metadata about the secret without showing sensitive values:
   ```
   python scripts/delinea_client.py --mock get-secret --id 1 --metadata-only
   ```

5. Get audit information for the secret:
   ```
   python scripts/delinea_client.py --mock get-secret --id 1 --audit
   ```

**Verification:**
* The command displays all fields of the secret
* Sensitive values are shown only when `--show-values` is used
* Specific field extraction works correctly
* Metadata and audit information is accessible

**Key Concepts:**
* Secrets contain multiple fields (username, password, host, port, etc.)
* Access to sensitive values can be restricted and audited
* Metadata tracks ownership, creation date, and last modification
* Audit logs show who accessed the secret and when
* Field-level access control is important for security

---

### Exercise 4: Create a New Secret

In this exercise, you'll create a new secret in Secret Server, understanding the structure and required fields.

**Objective:** Learn how to programmatically create and store new secrets.

**Steps:**

1. Create a simple secret with basic fields:
   ```
   python scripts/delinea_client.py --mock create-secret --name "test-api-key" --type "API Key" --username "service_user" --password "test_key_12345"
   ```

2. Create a secret in a specific folder:
   ```
   python scripts/delinea_client.py --mock create-secret --name "prod-db-credential" --type "Database" --folder "Infrastructure" --username "admin" --password "secure_pass_xyz"
   ```

3. Create a secret with additional metadata:
   ```
   python scripts/delinea_client.py --mock create-secret --name "backup-ftp-secret" --type "FTP" --username "backup_user" --password "ftp_pass_123" --notes "Used for daily backups"
   ```

4. Create a secret and get its ID back:
   ```
   python scripts/delinea_client.py --mock create-secret --name "new-https-cert" --type "Certificate" --field "certificate_data=-----BEGIN CERTIFICATE-----..."
   ```

**Verification:**
* The command returns a new secret ID
* The secret appears in list-secrets results
* All provided fields are stored correctly
* The secret can be retrieved using Exercise 3 commands

**Key Concepts:**
* Secrets are created with a template type that defines available fields
* Fields can be custom or predefined based on the template
* Secrets can be organized into folders at creation time
* Additional metadata like notes can be stored with the secret
* Each new secret receives a unique ID for reference

---

### Exercise 5: Work with Folders

In this exercise, you'll learn how to organize secrets using the folder hierarchy in Secret Server.

**Objective:** Understand folder organization and how to manage secret placement.

**Steps:**

1. List all folders in Secret Server:
   ```
   python scripts/delinea_client.py --mock list-folders
   ```

2. Create a new folder for organizing secrets:
   ```
   python scripts/delinea_client.py --mock create-folder --name "Application-Secrets" --parent "Infrastructure"
   ```

3. List secrets in a specific folder with folder path:
   ```
   python scripts/delinea_client.py --mock list-secrets --folder "Infrastructure/Application-Secrets"
   ```

4. Move a secret to a different folder:
   ```
   python scripts/delinea_client.py --mock move-secret --id 1 --destination "Infrastructure/Application-Secrets"
   ```

5. View the folder hierarchy:
   ```
   python scripts/delinea_client.py --mock list-folders --tree
   ```

**Verification:**
* Folders are created successfully with the specified names
* Secrets can be listed by folder
* Moving secrets changes their folder location
* The folder hierarchy is displayed correctly

**Key Concepts:**
* Folders provide logical organization for secrets
* Folder structure can be nested (parent/child relationships)
* Permissions are often managed at the folder level
* Moving secrets between folders helps reorganize as systems evolve
* Folder paths use "/" as a separator

---

### Exercise 6: List Templates

In this exercise, you'll explore the available secret templates and understand how they define secret structure.

**Objective:** Learn how templates standardize secret fields and help maintain consistency.

**Steps:**

1. List all available templates:
   ```
   python scripts/delinea_client.py --mock list-templates
   ```

2. Get details about a specific template:
   ```
   python scripts/delinea_client.py --mock get-template --name "Active Directory"
   ```

3. View fields required by a database template:
   ```
   python scripts/delinea_client.py --mock get-template --name "Database" --show-fields
   ```

4. List templates with descriptions:
   ```
   python scripts/delinea_client.py --mock list-templates --verbose
   ```

5. Find templates by category:
   ```
   python scripts/delinea_client.py --mock list-templates --category "Database"
   ```

**Verification:**
* Templates are listed with their names and categories
* Template details include all available fields
* Field requirements and constraints are displayed
* Filtering by category works correctly

**Key Concepts:**
* Templates define the structure and fields for different secret types
* Each template has mandatory and optional fields
* Templates ensure consistency across similar secrets
* Custom templates can be created to match organizational needs
* Templates are the foundation for secret standardization in Delinea

---

### Exercise 7 (Bonus): Export Secrets for Migration

In this bonus exercise, you'll learn how to export secrets from Secret Server for migration or auditing purposes.

**Objective:** Understand how to extract secrets in formats suitable for migration or backup.

**Steps:**

1. Export all secrets to a CSV file:
   ```
   python scripts/delinea_client.py --mock export-secrets --format csv --output secrets_backup.csv
   ```

2. Export secrets from a specific folder:
   ```
   python scripts/delinea_client.py --mock export-secrets --folder "Infrastructure" --format csv --output infrastructure_secrets.csv
   ```

3. Export secrets in JSON format with all field values:
   ```
   python scripts/delinea_client.py --mock export-secrets --format json --show-values --output secrets_with_values.json
   ```

4. Export a specific subset of secrets matching a query:
   ```
   python scripts/delinea_client.py --mock export-secrets --query "prod" --format csv --output prod_secrets.csv
   ```

**Verification:**
* Export files are created with the correct format
* CSV files contain headers and secret data
* JSON format preserves all metadata
* Field values are only shown when explicitly requested
* Filtered exports contain only matching secrets

**Key Concepts:**
* Export functionality is essential for disaster recovery
* Multiple formats (CSV, JSON) support different use cases
* Exported data must be handled carefully as it contains sensitive information
* Exports can be filtered to include only relevant secrets
* Regular exports help with backup and compliance requirements

---

## Mapping: Delinea Concepts vs. Vault Concepts

The following table shows how Delinea Secret Server concepts relate to HashiCorp Vault:

| Delinea Concept | Vault Concept | Purpose | Key Difference |
|-----------------|---------------|---------|-----------------|
| Secret | Secret/Key-Value | Stores sensitive data | Delinea emphasizes UI management; Vault is API-first |
| Template | Secret Engine/Auth Method | Defines data structure | Delinea templates are predefined; Vault engines are more flexible |
| Folder | Path/Mount Point | Organizes secrets logically | Delinea folders are hierarchical; Vault paths are flat strings |
| Field | Key/Value Pair | Individual data element | Delinea has typed fields; Vault stores arbitrary JSON |
| Permission | Policy | Controls access to secrets | Delinea uses role-based folder permissions; Vault uses policy-based paths |
| Secret Type | Secret Engine | Categorizes secrets by purpose | Similar concept with different names |
| User/Role | Identity/Policy | Controls who accesses secrets | Delinea emphasizes user roles; Vault emphasizes auth methods |
| Audit Trail | Audit Log | Tracks access and changes | Both log access; Delinea UI is more detailed |
| Export | Snapshot/Backup | Extracts data for migration | Both support export; Vault focuses on policies and configs |

**Key Takeaway:** While both solutions manage secrets, Delinea emphasizes centralized management through a UI with template-driven workflows, while Vault emphasizes API-first infrastructure-as-code approaches.

---

## Key Takeaways

After completing this lab, you should understand:

* **Connection Management:** How to connect to Secret Server using various authentication methods
* **Secret Discovery:** How to search and filter secrets using metadata and templates
* **Field Access:** How Secret Server manages multiple fields within a single secret
* **Secret Creation:** How templates guide the creation of new secrets with consistent structure
* **Organization:** How folders provide hierarchical organization and permission boundaries
* **Templates:** How secret templates standardize structure and reduce configuration errors
* **Comparison:** How Delinea's PAM approach differs from Vault's secrets management approach
* **Export Capabilities:** How to extract secrets safely for migration or compliance purposes

---

## Next Steps

1. **Lab 07 - Delinea Advanced Operations:** Learn about secret rotation, heartbeat checking, and automated credential management
2. **Integration Lab:** Configure your applications to retrieve secrets from Delinea
3. **Security Review:** Examine audit logs and permission settings
4. **Migration Planning:** Use export functionality to plan migration from other PAM solutions

For more information on Delinea Secret Server, visit the official documentation or consult with your security team about your organization's PAM strategy.

---

**Author:** Dominic M. Hoang
**Lab Version:** 1.0
**Last Updated:** 2026-01-19

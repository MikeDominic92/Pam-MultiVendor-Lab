<h1 align="center">PAM Multi-Vendor Lab</h1>
<h3 align="center">Enterprise Privileged Access Management Platform</h3>

<p align="center">
  <img src="https://img.shields.io/badge/HashiCorp-Vault_1.15+-F7931A.svg?style=flat-square&logo=vault&logoColor=white" alt="Vault"/>
  <img src="https://img.shields.io/badge/Delinea-Secret_Server-0078D4.svg?style=flat-square" alt="Delinea"/>
  <img src="https://img.shields.io/badge/AWS-Secrets_Manager-FF9900.svg?style=flat-square&logo=amazonaws&logoColor=white" alt="AWS"/>
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/3_PAM_Platforms-000000?style=flat-square" alt="Platforms"/>
  <img src="https://img.shields.io/badge/8_Lab_Exercises-000000?style=flat-square" alt="Labs"/>
  <img src="https://img.shields.io/badge/4_Python_Clients-000000?style=flat-square" alt="Clients"/>
  <img src="https://img.shields.io/badge/Bi--directional_Migration-000000?style=flat-square" alt="Migration"/>
</p>

---

<div align="center">

### What is PAM Multi-Vendor Lab?

**PAM Multi-Vendor Lab is a production-ready demonstration of enterprise privileged access management across HashiCorp Vault, Delinea Secret Server, and AWS Secrets Manager.**

</div>

<div align="center">

### The Problem It Solves

Modern enterprises rarely use a single PAM solution. CyberArk dominates large enterprise. Delinea serves mid-market. Vault powers DevOps. AWS Secrets Manager handles cloud workloads. PAM architects need expertise across all platforms, but vendor-specific training and isolated lab environments make cross-platform skills difficult to develop.

</div>

<div align="center">

### The Solution

PAM Multi-Vendor Lab provides a unified environment to learn, compare, and automate across three major PAM platforms. A Python abstraction layer enables cross-platform secret management. Migration tools move secrets bidirectionally between platforms. Mock modes allow full demonstrations without live credentials.

**Result: Multi-vendor PAM expertise. Cross-platform automation. Zero licensing cost.**

</div>

---

<p align="center">
  <a href="#overview">Overview</a> |
  <a href="#platform-screenshots">Screenshots</a> |
  <a href="#technical-problem-solving">Problem Solving</a> |
  <a href="#key-features">Features</a> |
  <a href="#architecture">Architecture</a> |
  <a href="#cli-reference">CLI</a> |
  <a href="#quick-start">Quick Start</a>
</p>

---

<div align="center">

## Overview

### The Challenge

| Challenge | Impact |
|:---------:|:------:|
| **60% of breaches** involve compromised credentials | Verizon DBIR |
| **PAM fragmentation** across 3-5 platforms per enterprise | Industry average |
| **$50K+ annually** for CyberArk licensing alone | Enterprise pricing |
| **Vendor lock-in** limits architecture flexibility | Migration difficulty |

### The Solution

| Capability | Result |
|:----------:|:------:|
| **Multi-Platform Abstraction** | Single API for Vault, Delinea, AWS |
| **Bi-directional Migration** | Move secrets between any platforms |
| **Mock Mode** | Full demos without credentials |
| **8 Lab Exercises** | Hands-on learning path |

</div>

---

<div align="center">

## Why PAM Multi-Vendor Lab

| Capability | Single Vendor | PAM Multi-Vendor Lab |
|:-----------|:--------------:|:--------------------:|
| **Platform Coverage** | 1 platform | 3 platforms |
| **Migration Tools** | Manual export/import | Automated with dry-run |
| **Cross-Platform API** | None | Unified abstraction |
| **Learning Cost** | $5K+ training | $0 |
| **Lab Environment** | Vendor-specific | Multi-vendor |
| **Architecture Comparison** | Limited | Side-by-side |

</div>

---

<div align="center">

## Platform Screenshots

**Multi-vendor PAM dashboard and CLI interfaces**

### Dashboard Overview
Real-time platform health with secret counts across Vault, Delinea, and AWS

<img src="docs/images/dashboard-new.svg" alt="Dashboard Overview" width="800">

---

### Delinea Client Demo
Full-featured Python client with OAuth2 authentication and mock mode

<img src="assets/delinea_client_demo.svg" alt="Delinea Client" width="800">

---

### Unified PAM Client
Cross-platform abstraction layer with health checks and secret comparison

<img src="assets/unified_pam_demo.svg" alt="Unified PAM Client" width="800">

---

### Migration Tools
Bi-directional migration with dry-run, field mapping, and JSON reports

<img src="assets/migration_demo.svg" alt="Migration Tools" width="800">

</div>

---

<h2 align="center">Technical Problem Solving</h2>

<p align="center"><em>Real enterprise PAM challenges and the architectural solutions I built to solve them.</em></p>

<div align="center">

<h3>Challenge 1: Multi-Vendor Secret Management</h3>

> *"How do you manage secrets across Vault, Delinea, and AWS with a single workflow?"*

**My Answer:** Abstract the platforms behind a unified interface.

| Component | Description |
|:----------|:------------|
| **Platform Adapters** | VaultAdapter, DelineaAdapter, AWSAdapter with consistent methods |
| **UnifiedSecret Model** | Platform-agnostic secret representation |
| **Auto-Detection** | Discover available platforms from environment |
| **Health Monitoring** | Check connectivity across all platforms simultaneously |
| **Result** | One API, three platforms, zero vendor lock-in |

**Solution Architecture:**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
flowchart TD
    subgraph App["Application Layer"]
        A[Unified PAM Client]
    end

    subgraph Adapters["Platform Adapters"]
        B[VaultAdapter]
        C[DelineaAdapter]
        D[AWSAdapter]
    end

    subgraph Platforms["PAM Platforms"]
        E[HashiCorp Vault]
        F[Delinea Secret Server]
        G[AWS Secrets Manager]
    end

    A --> B
    A --> C
    A --> D
    B --> E
    C --> F
    D --> G
```

| Metric | Impact |
|:------:|:------:|
| Platforms supported | **3** |
| API consistency | **100%** |
| Vendor lock-in | **Eliminated** |

</div>

---

<div align="center">

<h3>Challenge 2: Cross-Platform Migration</h3>

> *"How do you migrate 500 secrets from Delinea to Vault without data loss?"*

**My Answer:** Dry-run everything. Map fields intelligently. Generate audit trails.

| Component | Description |
|:----------|:------------|
| **Dry-Run Mode** | Preview migration without executing |
| **Field Mapping** | Delinea fields map to Vault paths automatically |
| **Template Detection** | Windows Account, Unix SSH, Database, API Key templates |
| **Path Recommendation** | Intelligent Vault path suggestions based on secret type |
| **JSON Reports** | Complete audit trail of migration operations |
| **Result** | Zero-risk migration with full visibility |

**Solution Architecture:**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
flowchart LR
    subgraph Source["Source Platform"]
        A[Delinea Secret Server]
        B[Secret with Template]
    end

    subgraph Migration["Migration Engine"]
        C[Read Secret]
        D[Detect Template Type]
        E[Map Fields]
        F[Generate Vault Path]
        G[Dry-Run Preview]
    end

    subgraph Target["Target Platform"]
        H[HashiCorp Vault]
        I[KV v2 Secret]
    end

    A --> B --> C --> D --> E --> F --> G --> H --> I
```

</div>

---

<div align="center">

<h3>Challenge 3: Platform Selection</h3>

> *"When should I use Vault vs Delinea vs CyberArk vs AWS?"*

**My Answer:** Match platform strengths to use case requirements.

| Platform | Strength | Best For | Weakness |
|:---------|:---------|:---------|:---------|
| **CyberArk** | Session recording, discovery | Large enterprise, compliance | Cost, complexity |
| **Delinea** | Faster deployment, mid-market | IT teams, Windows environments | Less cloud-native |
| **HashiCorp Vault** | Dynamic secrets, API-first | DevOps, microservices, CI/CD | No session recording |
| **AWS Secrets Manager** | Native AWS integration | Lambda, ECS, cloud workloads | AWS-only |

**Solution Architecture:**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
flowchart TD
    A[PAM Platform Selection] --> B{Use Case?}

    B -->|Session Recording Required| C[CyberArk or Delinea]
    B -->|Dynamic Secrets for Apps| D[HashiCorp Vault]
    B -->|AWS Native Workloads| E[AWS Secrets Manager]
    B -->|Hybrid Environment| F[Vault + Delinea]

    C --> G[Enterprise IT, Compliance]
    D --> H[DevOps, CI/CD, Microservices]
    E --> I[Lambda, ECS, Cloud-Native]
    F --> J[Best of Both Worlds]
```

</div>

---

<div align="center">

<h3>Challenge 4: Dynamic Secrets at Scale</h3>

> *"How do you eliminate standing privileges for database access?"*

**My Answer:** Generate credentials on-demand with automatic expiration.

| Component | Description |
|:----------|:------------|
| **Database Secrets Engine** | PostgreSQL, MySQL, MSSQL support |
| **Lease Management** | Credentials expire automatically |
| **Role-Based Access** | Different TTLs for different roles |
| **Audit Trail** | Every credential generation logged |
| **Result** | No standing privileges, no credential sprawl |

**Solution Architecture:**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
sequenceDiagram
    participant App as Application
    participant Vault as HashiCorp Vault
    participant DB as PostgreSQL

    App->>Vault: Request database credentials
    Vault->>DB: CREATE ROLE with TTL
    DB-->>Vault: Role created
    Vault-->>App: Dynamic credentials (1h TTL)
    App->>DB: Connect with dynamic creds
    Note over Vault: After 1 hour...
    Vault->>DB: DROP ROLE (automatic)
```

| Metric | Impact |
|:------:|:------:|
| Standing privileges | **Eliminated** |
| Credential rotation | **Automatic** |
| Audit coverage | **100%** |

</div>

---

<div align="center">

<h3>Challenge 5: Automated Password Rotation</h3>

> *"How do you rotate 1000 service account passwords without downtime?"*

**My Answer:** Coordinated rotation with verification and rollback.

| Component | Description |
|:----------|:------------|
| **Rotation Policies** | Configurable schedules per secret type |
| **Pre-Rotation Hooks** | Verify connectivity before rotation |
| **Post-Rotation Verification** | Test new credentials before committing |
| **Rollback Support** | Automatic rollback on verification failure |
| **Result** | Zero-downtime rotation at scale |

**Solution Architecture:**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
flowchart TD
    A[Rotation Triggered] --> B[Pre-Rotation Check]
    B -->|Pass| C[Generate New Password]
    B -->|Fail| D[Abort and Alert]

    C --> E[Update Target System]
    E --> F[Post-Rotation Verify]

    F -->|Pass| G[Commit to Vault]
    F -->|Fail| H[Rollback]

    G --> I[Update Dependents]
    H --> J[Restore Previous]
```

</div>

---

<div align="center">

### Architecture Decisions Summary

| Problem | My Solution | Why It Works |
|:-------:|:-----------:|:------------:|
| Multi-vendor management | Unified abstraction layer | Single API, multiple platforms |
| Cross-platform migration | Dry-run with field mapping | Zero-risk, auditable |
| Platform selection | Feature comparison matrix | Match strengths to use cases |
| Standing privileges | Dynamic secrets engine | On-demand with auto-expiration |
| Password rotation | Coordinated with verification | Zero-downtime at scale |

</div>

---

<div align="center">

## Key Features

### Core Capabilities

| Feature | Description |
|:-------:|:-----------:|
| **Delinea Python Client** | Full OAuth2 authentication, CRUD operations, folder management |
| **Unified PAM Client** | Single interface for Vault, Delinea, and AWS |
| **Migration Tools** | Bi-directional with dry-run, field mapping, JSON reports |
| **Mock Mode** | Complete demos without live credentials |
| **Rich CLI** | Professional terminal UI with progress bars |
| **8 Lab Exercises** | Hands-on learning from basics to advanced |

### Platform Support

| Platform | Features |
|:--------:|:---------|
| **HashiCorp Vault** | KV v2, dynamic database credentials, PKI, transit encryption |
| **Delinea Secret Server** | OAuth2, secret templates, folder hierarchy, search |
| **AWS Secrets Manager** | Boto3 integration, rotation, cross-account access |

</div>

---

<div align="center">

## Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
flowchart TD
    subgraph CLI["CLI Layer"]
        A[delinea_client.py]
        B[unified_pam_client.py]
        C[vault_to_delinea.py]
        D[delinea_to_vault.py]
    end

    subgraph Core["Core Libraries"]
        E[DelineaSecretServerClient]
        F[UnifiedPAMClient]
        G[VaultAdapter]
        H[AWSAdapter]
    end

    subgraph Platforms["PAM Platforms"]
        I[HashiCorp Vault<br/>Docker Container]
        J[Delinea Secret Server<br/>Mock or Cloud]
        K[AWS Secrets Manager<br/>Mock or Live]
    end

    subgraph Data["Target Systems"]
        L[(PostgreSQL)]
        M[(MySQL)]
        N[Linux Servers]
        O[Windows Servers]
    end

    A --> E
    B --> F
    C --> F
    D --> F
    F --> G
    F --> E
    F --> H
    G --> I
    E --> J
    H --> K
    I --> L
    I --> M
    I --> N
    I --> O
```

### Migration Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d2d2d', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#4a4a4a', 'secondaryColor': '#3a3a3a', 'tertiaryColor': '#1a1a1a', 'background': '#1a1a1a', 'mainBkg': '#2d2d2d', 'nodeBorder': '#000000', 'clusterBkg': '#252525', 'clusterBorder': '#000000', 'titleColor': '#ffffff', 'edgeLabelBackground': '#2d2d2d'}}}%%
flowchart LR
    A[Delinea Secret] --> B[Read & Parse]
    B --> C[Detect Template]
    C --> D[Map Fields]
    D --> E{Dry Run?}
    E -->|Yes| F[Preview Report]
    E -->|No| G[Write to Vault]
    G --> H[Verify]
    H --> I[JSON Audit Log]
```

</div>

---

<div align="center">

## CLI Reference

### Delinea Client

| Command | Description |
|:--------|:------------|
| `--mock status` | Check connection and secret count |
| `--mock list` | List all secrets |
| `--mock get <id>` | Retrieve secret by ID |
| `--mock create` | Create new secret |
| `--mock folders` | List folder hierarchy |
| `--mock templates` | List available templates |
| `--mock demo` | Run full demonstration |

### Unified PAM Client

| Command | Description |
|:--------|:------------|
| `detect` | Discover available platforms |
| `health` | Health check all platforms |
| `get <id> --platform` | Get secret from specific platform |
| `compare` | Compare secrets across platforms |
| `demo` | Run cross-platform demonstration |

### Migration Tools

| Command | Description |
|:--------|:------------|
| `migrate <id> --dry-run` | Preview single secret migration |
| `folder <id> --base-path` | Migrate entire folder |
| `--output report.json` | Generate JSON audit report |
| `demo` | Run migration demonstration |

</div>

---

<div align="center">

## Lab Exercises

| Lab | Topic | Duration | Level |
|:---:|:-----:|:--------:|:-----:|
| 01 | Vault Fundamentals | 30 min | Beginner |
| 02 | KV Secrets Engine | 30 min | Beginner |
| 03 | Dynamic Database Credentials | 45 min | Intermediate |
| 04 | Automated Password Rotation | 45 min | Intermediate |
| 05 | Audit and Compliance | 30 min | Intermediate |
| 06 | Delinea Secret Server Basics | 30 min | Beginner |
| 07 | Cross-Platform Migration | 45 min | Advanced |
| 08 | Unified PAM Operations | 30 min | Advanced |

</div>

---

<div align="center">

## Platform Comparison

| Feature | CyberArk | Delinea | Vault | AWS SM |
|:--------|:--------:|:-------:|:-----:|:------:|
| Password Vaulting | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ |
| Session Recording | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ | ★☆☆☆☆ |
| Account Discovery | ★★★★★ | ★★★★☆ | ★★☆☆☆ | ★☆☆☆☆ |
| Dynamic Secrets | ★★★☆☆ | ★★☆☆☆ | ★★★★★ | ★★☆☆☆ |
| API Automation | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| Cloud Deployment | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★★★★ |
| Open Source | No | No | Yes | No |
| Cost | $$$$$ | $$$ | $ | $$ |

### My Recommendations

| Scenario | Platform | Reason |
|:---------|:--------:|:-------|
| Large enterprise, strict compliance | CyberArk | Most comprehensive, industry standard |
| Mid-market, faster deployment | Delinea | Good balance of features and complexity |
| DevOps, cloud-native | HashiCorp Vault | Dynamic secrets, API-first design |
| AWS-native workloads | AWS Secrets Manager | Native integration, no additional tools |
| Hybrid architecture | Vault + Delinea | Best of both worlds |

</div>

---

<h2 align="center">Quick Start</h2>

<h3 align="center">Prerequisites</h3>

<p align="center">Python 3.10+ | Docker & Docker Compose | 8GB RAM</p>

### Installation

```bash
# Clone repository
git clone https://github.com/MikeDominic92/Pam-MultiVendor-Lab.git
cd Pam-MultiVendor-Lab

# Set up Python environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r scripts/requirements.txt

# Configure environment
cp .env.example .env

# Start Vault (Docker)
cd vault
docker-compose up -d
./scripts/init-vault.sh
```

### Run Demos (No Credentials Required)

```bash
# Delinea client demo
python scripts/delinea_client.py --mock demo

# Unified PAM client demo
python scripts/unified_pam_client.py demo

# Migration demo
python scripts/delinea_to_vault.py demo
```

---

<h2 align="center">Project Structure</h2>

```
Pam-MultiVendor-Lab/
|-- scripts/
|   |-- delinea_client.py       # Delinea Secret Server Python client
|   |-- unified_pam_client.py   # Cross-platform PAM abstraction
|   |-- vault_client.py         # HashiCorp Vault operations
|   |-- vault_to_delinea.py     # Migration: Vault -> Delinea
|   |-- delinea_to_vault.py     # Migration: Delinea -> Vault
|   |-- config.py               # Unified configuration
|   `-- aws/                    # AWS Secrets Manager integration
|-- vault/
|   |-- config/                 # Vault configuration files
|   |-- policies/               # ACL policies
|   `-- scripts/                # Initialization scripts
|-- delinea/
|   |-- api-examples/           # Python API examples
|   |-- powershell/             # PowerShell scripts
|   `-- templates/              # Secret template definitions
|-- labs/                       # 8 hands-on exercises
|-- docs/                       # Documentation
|-- assets/                     # Screenshots and diagrams
|-- frontend/                   # React dashboard
`-- monitoring/                 # Prometheus & Grafana
```

---

<div align="center">

## Certifications Aligned

This lab supports preparation for:

| Certification | Alignment |
|:-------------:|:----------|
| **CyberArk PAM-DEF** | Vault concepts map to CyberArk components |
| **Delinea Security Academy** | Direct Delinea Secret Server experience |
| **HashiCorp Vault Associate** | Full Vault operations coverage |
| **HashiCorp Vault Operations Professional** | Advanced patterns and automation |
| **AWS Security Specialty** | Secrets Manager integration |

</div>

---

<div align="center">

## Roadmap

### Completed

| Version | Features |
|:-------:|:---------|
| v1.0 | Core Vault lab with databases and monitoring |
| v1.1 | AWS Secrets Manager integration |
| v2.0 | Delinea integration, unified client, migration tools |

### Upcoming

| Version | Features |
|:-------:|:---------|
| v2.1 | Azure Key Vault integration |
| v2.2 | Google Cloud Secret Manager |
| v3.0 | HashiCorp Boundary for session management |

</div>

---

<div align="center">

## Built With

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Vault-F7931A?style=for-the-badge&logo=vault&logoColor=white" alt="Vault"/>
  <img src="https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS"/>
</p>

| Category | Technologies |
|:--------:|:-------------|
| **PAM Platforms** | HashiCorp Vault 1.15+, Delinea Secret Server, AWS Secrets Manager |
| **Languages** | Python 3.10+, PowerShell, Bash |
| **Libraries** | hvac, python-tss-sdk, boto3, click, rich, pydantic |
| **Infrastructure** | Docker Compose, Prometheus, Grafana |
| **Databases** | PostgreSQL, MySQL (for dynamic secrets) |

</div>

---

<div align="center">

## Author

**Dominic M. Hoang**

GitHub: [@MikeDominic92](https://github.com/MikeDominic92)

</div>

---

<div align="center">

## Related Projects

| Project | Description |
|:-------:|:-----------:|
| [VendorAuditAI](https://github.com/MikeDominic92/VendorAuditAI) | AI-powered third-party risk management platform |
| [ai-access-sentinel](https://github.com/MikeDominic92/ai-access-sentinel) | ITDR platform with ML-powered anomaly detection |
| [entra-id-governance](https://github.com/MikeDominic92/entra-id-governance) | Microsoft Entra ID governance toolkit |
| [keyless-kingdom](https://github.com/MikeDominic92/keyless-kingdom) | Multi-cloud workload identity federation |
| [okta-sso-hub](https://github.com/MikeDominic92/okta-sso-hub) | Enterprise SSO with SAML, OIDC, SCIM |

</div>

---

<p align="center">
  <strong>PAM Multi-Vendor Lab</strong>
  <br/>
  <sub>Enterprise PAM expertise across CyberArk, Delinea, Thycotic, and HashiCorp ecosystems.</sub>
  <br/><br/>
  <a href="https://github.com/MikeDominic92/Pam-MultiVendor-Lab">GitHub</a>
  <br/><br/>
  MIT License - Copyright 2026 Dominic M. Hoang
</p>

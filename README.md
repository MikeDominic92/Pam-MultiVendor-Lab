# PAM-Vault-Lab

[![Docker](https://img.shields.io/badge/Docker-Required-blue?logo=docker)](https://www.docker.com/)
[![Vault](https://img.shields.io/badge/Vault-1.15+-orange?logo=vault)](https://www.vaultproject.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CyberArk](https://img.shields.io/badge/CyberArk-PAM--DEF-red)](https://www.cyberark.com/)

> A comprehensive home lab for practicing Privileged Access Management (PAM) using HashiCorp Vault, designed to align with CyberArk PAM-DEF certification concepts.

## Overview

PAM-Vault-Lab is a production-ready practice environment that simulates enterprise PAM workflows using open-source tools. Perfect for IAM professionals preparing for CyberArk PAM-DEF certification or building hands-on experience with secrets management.

## Lab Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Host                             │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ HashiCorp    │    │  PostgreSQL  │    │    MySQL     │  │
│  │   Vault      │◄───┤  (Target)    │    │  (Target)    │  │
│  │  (PAM Core)  │    └──────────────┘    └──────────────┘  │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ├────────────┬──────────────┬──────────────────┐   │
│         ▼            ▼              ▼                  ▼   │
│  ┌──────────┐ ┌──────────┐  ┌──────────┐      ┌──────────┐│
│  │  Linux   │ │Prometheus│  │ Grafana  │      │  Audit   ││
│  │SSH Target│ │(Metrics) │  │(Dashboard)│      │  Logs    ││
│  └──────────┘ └──────────┘  └──────────┘      └──────────┘│
│                                                               │
└───────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    ┌────────┐          ┌─────────┐         ┌──────────┐
    │Ansible │          │PowerShell│        │  Python  │
    │Playbooks│         │ Scripts  │        │  Client  │
    └────────┘          └─────────┘         └──────────┘
```

## Features

- **Secrets Management**: KV secrets engine with versioning and rollback
- **Dynamic Credentials**: On-demand database credentials with automatic expiration
- **Password Rotation**: Automated credential rotation for static accounts
- **Audit Logging**: Complete audit trail of all access and operations
- **Policy Management**: Fine-grained access control using Vault policies
- **Multi-Protocol Support**: SSH, database (PostgreSQL/MySQL), and API targets
- **Monitoring**: Prometheus metrics with Grafana dashboards
- **Automation**: Ansible playbooks, PowerShell, and Python scripts

## CyberArk PAM-DEF Alignment

| CyberArk Concept | Vault Equivalent | Lab Exercise |
|------------------|------------------|--------------|
| Vault (Safe) | KV Secrets Engine | Exercise 1, 2 |
| CPM (Central Policy Manager) | Rotation Scripts | Exercise 4 |
| PSM (Privileged Session Manager) | SSH Proxy (concept) | Exercise 3 |
| PVWA (Password Vault Web Access) | Vault UI/API | All exercises |
| Dual Control | Vault Policies + Approvals | Exercise 2 |
| Dynamic Credentials | Database Secrets Engine | Exercise 3 |
| Audit & Compliance | Audit Device | Exercise 5 |

## Prerequisites

### Hardware Requirements
- **CPU**: 2+ cores
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 20GB free space
- **OS**: Windows 10/11, macOS, or Linux

### Software Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop) 20.10+
- [Docker Compose](https://docs.docker.com/compose/) 2.0+
- Git
- (Optional) Python 3.9+, Ansible 2.10+, PowerShell 7+

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/MikeDominic92/pam-vault-lab.git
cd pam-vault-lab
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your preferences (defaults work for most setups)
```

### 3. Start the Lab

```bash
docker-compose up -d
```

This will start:
- Vault server (http://localhost:8200)
- PostgreSQL database (localhost:5432)
- MySQL database (localhost:3306)
- SSH target server (localhost:2222)
- Prometheus (http://localhost:9090)
- Grafana (http://localhost:3000)

### 4. Initialize Vault

```bash
# Initialize and unseal Vault
docker exec -it vault /scripts/init-vault.sh

# Save the root token and unseal keys displayed!
```

### 5. Access Vault UI

1. Open http://localhost:8200
2. Login with root token from initialization
3. Explore the UI and secrets engines

### 6. Start Lab Exercises

Follow the exercises in order:
1. [Vault Basics](exercises/01-vault-basics.md) - Initialize, unseal, policies
2. [Secret Management](exercises/02-secret-management.md) - KV engine, versioning
3. [Dynamic Credentials](exercises/03-dynamic-credentials.md) - Database secrets
4. [Password Rotation](exercises/04-password-rotation.md) - Automated rotation
5. [Audit & Logging](exercises/05-audit-logging.md) - Compliance reporting

## Project Structure

```
pam-vault-lab/
├── docker-compose.yml          # Infrastructure definition
├── vault/                      # Vault configuration
│   ├── config/vault.hcl       # Vault server config
│   ├── policies/              # Access control policies
│   └── scripts/               # Initialization scripts
├── automation/                 # Automation tools
│   ├── ansible/               # Ansible playbooks
│   ├── powershell/            # Windows scripts
│   └── python/                # Python clients
├── exercises/                  # Step-by-step labs
├── targets/                    # Target systems
├── tests/                      # Integration tests
└── docs/                       # Documentation
```

## Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed installation and troubleshooting
- [Vault Basics](docs/VAULT_BASICS.md) - HashiCorp Vault fundamentals
- [CyberArk Concepts](docs/CYBERARK_CONCEPTS.md) - PAM concepts mapped to Vault
- [Security Best Practices](docs/SECURITY.md) - Lab security guidelines
- [Cost Analysis](docs/COST_ANALYSIS.md) - Why this is $0 (vs CyberArk licensing)
- [Lab Exercises](docs/LAB_EXERCISES.md) - Complete exercise index

## HashiCorp Vault vs CyberArk

| Feature | HashiCorp Vault | CyberArk Enterprise |
|---------|----------------|---------------------|
| **Cost** | Open Source (Free) | $50K+ annually |
| **Deployment** | Self-hosted, Cloud | On-premise, Cloud |
| **Learning Curve** | Moderate | Steep |
| **Home Lab Friendly** | Yes | No (licensing) |
| **Enterprise Support** | Available (paid) | Included |
| **API-First** | Yes | Yes |
| **Dynamic Secrets** | Native | Available |
| **Multi-Cloud** | Excellent | Good |
| **Session Management** | Limited | Excellent (PSM) |

**For CyberArk PAM-DEF Preparation**: This lab teaches core PAM concepts that directly apply to CyberArk, using freely available tools. Vault's architecture mirrors many CyberArk components, making knowledge transfer straightforward.

## Automation Examples

### Retrieve Secret with Python

```python
import hvac

client = hvac.Client(url='http://localhost:8200', token='your-token')
secret = client.secrets.kv.v2.read_secret_version(path='database/prod')
print(secret['data']['data']['password'])
```

### Rotate Password with Ansible

```bash
ansible-playbook automation/ansible/playbooks/rotate-password.yml
```

### Checkout Credentials with PowerShell

```powershell
.\automation\powershell\Get-VaultSecrets.ps1 -SecretPath "database/prod"
```

## Monitoring

Access Grafana at http://localhost:3000 (admin/admin):
- Vault operations metrics
- Secret access patterns
- Rotation success rates
- Audit event timelines

## Testing

Run integration tests:

```bash
# Python tests
cd tests
pip install -r ../automation/python/requirements.txt
pytest test_vault_connection.py
pytest test_rotation.py
```

## Troubleshooting

### Vault is sealed
```bash
docker exec -it vault vault operator unseal <unseal-key>
```

### Can't connect to Vault
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs vault
```

### Reset entire lab
```bash
docker-compose down -v
docker-compose up -d
```

See [Setup Guide](docs/SETUP_GUIDE.md) for more troubleshooting.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security Note

**This is a LAB ENVIRONMENT.** Do not use dev mode Vault or these configurations in production. See [docs/SECURITY.md](docs/SECURITY.md) for production hardening.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License - see [LICENSE](LICENSE) file.

## Certification Resources

- [CyberArk PAM-DEF Exam](https://www.cyberark.com/services-support/technical-education/defender-exam/)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [PAM Best Practices](https://www.cyberark.com/what-is/privileged-access-management/)

## Acknowledgments

- HashiCorp for Vault
- CyberArk for PAM industry leadership
- Docker community

## Author

**Mike Dominic**
- GitHub: [@MikeDominic92](https://github.com/MikeDominic92)
- Portfolio: [IAM-Portfolio](https://github.com/MikeDominic92/IAM-Portfolio)

---

**Built for learning. Designed for excellence.** Star this repo if it helps your IAM journey!

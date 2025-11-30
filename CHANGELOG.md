# Changelog

All notable changes to PAM-Vault-Lab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-30

### Added
- Initial release of PAM-Vault-Lab
- Complete Docker Compose setup with 6 services (Vault, PostgreSQL, MySQL, SSH target, Prometheus, Grafana)
- HashiCorp Vault configuration with development mode
- Three Vault policies (admin, readonly, rotation)
- Comprehensive documentation:
  - Setup guide with troubleshooting
  - Vault basics tutorial
  - CyberArk concepts mapping
  - Cost analysis
  - Security best practices
- Five complete lab exercises:
  1. Vault Basics (initialization, policies, tokens)
  2. Secret Management (KV engine, versioning)
  3. Dynamic Credentials (database secrets engine)
  4. Password Rotation (automated rotation)
  5. Audit & Logging (compliance reporting)
- Automation suite:
  - Ansible playbooks for Vault setup and rotation
  - PowerShell scripts for Windows integration
  - Python client library with examples
- Integration tests for Vault connection and rotation
- GitHub Actions CI/CD workflow
- Target systems (Linux SSH, PostgreSQL, MySQL)
- Monitoring with Prometheus and Grafana
- Architecture Decision Record (ADR-001) explaining Vault selection
- MIT License
- Contributing guidelines
- Comprehensive README with quick start

### Infrastructure
- Vault 1.15+ in development mode
- PostgreSQL 15 for dynamic credentials practice
- MySQL 8.0 for rotation exercises
- Alpine Linux SSH target
- Prometheus for metrics collection
- Grafana for visualization

### Documentation
- README.md with badges, architecture diagram, and comparison table
- 7 documentation files in `docs/` directory
- 5 hands-on exercises with step-by-step instructions
- ADR explaining technology choices
- Security warnings for lab vs production usage

### Automation
- 2 Ansible playbooks with inventory and configuration
- 3 PowerShell scripts for Windows environments
- 3 Python scripts with requirements.txt
- Initialization scripts for Vault

### Configuration
- `.env.example` with all configurable parameters
- `.gitignore` for security and cleanliness
- Vault HCL configuration
- Docker Compose with health checks and dependencies

### Testing
- Python test suite for Vault connectivity
- Rotation validation tests
- CI workflow for automated testing

## [Unreleased]

### Planned
- Additional exercises for advanced Vault features
- Terraform integration for infrastructure as code
- Additional target systems (Windows Server, Active Directory)
- Web UI for exercise progress tracking
- Video walkthroughs for each exercise
- Multi-tenancy scenarios
- Disaster recovery exercise
- Transit secrets engine exercise
- PKI secrets engine for certificate management
- LDAP authentication integration

---

## Version History

- **1.0.0** (2025-11-30): Initial release with complete lab environment

## Migration Notes

### From Nothing to 1.0.0
This is the initial release. Follow the Quick Start guide in README.md.

## Breaking Changes

None yet - initial release.

## Security Updates

None yet - initial release. Always use latest Docker images for security patches.

---

For detailed changes, see the [commit history](https://github.com/MikeDominic92/pam-vault-lab/commits/main).

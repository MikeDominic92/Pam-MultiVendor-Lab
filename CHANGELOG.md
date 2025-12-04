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

## [1.1.0] - 2025-12-04

### Added - AWS Secrets Manager Integration
- **New `src/integrations/` module** for hybrid cloud secret management
- **AWS Secrets Manager Connector** (`aws_secrets_connector.py`):
  - Full CRUD operations for AWS Secrets Manager via boto3
  - Mock mode for offline demos without AWS credentials
  - Secret health/staleness scoring algorithm
  - Comprehensive audit logging
  - Support for secret tagging and metadata
  - Type hints and detailed docstrings
- **Bidirectional Secret Sync** (`secret_sync.py`):
  - Sync secrets between HashiCorp Vault and AWS Secrets Manager
  - Multiple sync directions: Vault→AWS, AWS→Vault, Bidirectional
  - Conflict detection and resolution strategies (overwrite, skip, use newest, manual)
  - Batch synchronization support
  - Dry-run mode for testing
  - Sync status tracking and reporting
  - Audit trail export (JSON format)
- **Rotation Event Handler** (`rotation_handler.py`):
  - AWS Lambda-compatible rotation event processing
  - 4-step rotation workflow (create, set, test, finish)
  - Vault database rotation integration
  - Rotation scheduling and tracking
  - Success rate calculation
  - Rollback support for failed rotations
  - Rotation history export
- **Dependencies**: Added boto3 and botocore for AWS integration

### Enhanced
- Updated `requirements.txt` with AWS SDK (boto3==1.34.51, botocore==1.34.51)
- All new code includes December 2025 v1.1 enhancement comments
- Comprehensive error handling and logging throughout
- Type hints for better IDE support and code quality

### Documentation
- Updated README.md with v1.1 AWS Integration section
- Enhanced CHANGELOG.md with detailed v1.1 release notes
- All modules include detailed docstrings and usage examples

### Technical Details
- Architecture: Modular design with separation of concerns
- Mock Mode: Full offline demo capability without AWS credentials
- Audit Trail: Complete logging of all sync and rotation operations
- Health Scoring: Algorithm considers staleness, rotation status, tags, and access patterns
- Conflict Resolution: Multiple strategies for handling sync conflicts

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
- AWS Secrets Manager exercise in lab curriculum

---

## Version History

- **1.1.0** (2025-12-04): AWS Secrets Manager integration with sync and rotation handling
- **1.0.0** (2025-11-30): Initial release with complete lab environment

## Migration Notes

### From 1.0.0 to 1.1.0
1. Update Python dependencies: `pip install -r automation/python/requirements.txt`
2. New AWS integration modules available in `src/integrations/`
3. Configure AWS credentials (or use mock mode for demos)
4. Optional: Review AWS Secrets Manager Integration section in README.md

### From Nothing to 1.0.0
This is the initial release. Follow the Quick Start guide in README.md.

## Breaking Changes

None yet - initial release.

## Security Updates

None yet - initial release. Always use latest Docker images for security patches.

---

For detailed changes, see the [commit history](https://github.com/MikeDominic92/pam-vault-lab/commits/main).

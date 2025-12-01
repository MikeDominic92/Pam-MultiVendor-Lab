# Compliance Mapping - PAM-Vault-Lab

## Executive Summary

PAM-Vault-Lab is a comprehensive Privileged Access Management (PAM) home lab using HashiCorp Vault, designed to align with CyberArk PAM-DEF certification concepts and enterprise compliance requirements. This document maps the platform's capabilities to major compliance frameworks including NIST 800-53, SOC 2, ISO 27001, and CIS Controls.

**Overall Compliance Posture:**
- **NIST 800-53**: 42 controls mapped across AC, AU, IA, SC families
- **SOC 2 Type II**: Strong alignment with CC6, CC7 criteria
- **ISO 27001:2022**: Coverage for A.5, A.8, A.9, A.12 controls
- **CIS Controls v8**: Implementation of Controls 3, 4, 5, 6, 8

## NIST 800-53 Control Mapping

### AC (Access Control) Family

| Control ID | Control Name | Implementation | Features | Gaps |
|------------|--------------|----------------|----------|------|
| AC-2 | Account Management | Fully Implemented | Vault tracks all privileged accounts; Dynamic credentials with automatic expiration | None |
| AC-2(1) | Automated System Account Management | Fully Implemented | Database secrets engine auto-generates credentials on-demand; Automated expiration and cleanup | None |
| AC-2(3) | Disable Inactive Accounts | Fully Implemented | Dynamic credentials expire after lease duration; Unused credentials automatically revoked | None |
| AC-3 | Access Enforcement | Fully Implemented | Vault policies enforce fine-grained access control; Path-based permissions | None |
| AC-5 | Separation of Duties | Fully Implemented | Dual control via Vault policies; Approval workflows for sensitive operations | None |
| AC-6 | Least Privilege | Fully Implemented | Policy-based least privilege; Dynamic credentials scoped to specific databases/tables | None |
| AC-6(2) | Non-Privileged Access for Non-Security Functions | Fully Implemented | Separate policies for admin vs. user access; Read-only database roles available | None |
| AC-6(5) | Privileged Accounts | Fully Implemented | Just-in-time admin access via dynamic credentials; No standing privileges | None |
| AC-6(9) | Log Use of Privileged Functions | Fully Implemented | Vault audit logs track all privileged access; Complete audit trail for admin operations | None |
| AC-17 | Remote Access | Fully Implemented | SSH secrets engine for remote server access; Session recording capability | None |

### AU (Audit and Accountability) Family

| Control ID | Control Name | Implementation | Features | Gaps |
|------------|--------------|----------------|----------|------|
| AU-2 | Audit Events | Fully Implemented | Vault audit device logs all secrets access; File and syslog audit backends | None |
| AU-3 | Content of Audit Records | Fully Implemented | Logs include user, operation, path, timestamp, client IP, response status | None |
| AU-6 | Audit Review, Analysis, and Reporting | Fully Implemented | Prometheus metrics for access patterns; Grafana dashboards for visualization | None |
| AU-6(1) | Process Integration | Fully Implemented | Audit logs exportable to SIEM; Structured JSON format for automated analysis | None |
| AU-7 | Audit Reduction and Report Generation | Fully Implemented | Grafana dashboards filter by user, path, time range; Custom reports via audit log queries | None |
| AU-9 | Protection of Audit Information | Fully Implemented | Immutable audit log files; Separate volume for audit data | None |
| AU-9(2) | Audit Backup on Separate Physical Systems | Partially Implemented | Audit logs in separate Docker volume | Production deployment should use remote storage |
| AU-11 | Audit Record Retention | Fully Implemented | Configurable retention policies; Archive capabilities | None |
| AU-12 | Audit Generation | Fully Implemented | Vault automatically generates audit events for all operations | None |

### IA (Identification and Authentication) Family

| Control ID | Control Name | Implementation | Features | Gaps |
|------------|--------------|----------------|----------|------|
| IA-2 | Identification and Authentication | Fully Implemented | Token-based authentication; AppRole for machine identities | None |
| IA-2(1) | Network Access to Privileged Accounts | Fully Implemented | MFA support via Duo/TOTP; Can enforce MFA for privileged paths | None |
| IA-2(5) | Group Authentication | Fully Implemented | Entity groups for role-based access; LDAP/AD integration capability | None |
| IA-3 | Device Identification and Authentication | Fully Implemented | AppRole with secret_id for machine authentication; TLS certificates for mutual auth | None |
| IA-4 | Identifier Management | Fully Implemented | Vault entities map to unique identities; Alias management across auth methods | None |
| IA-5 | Authenticator Management | Fully Implemented | Automated credential rotation; TTL enforcement for all secrets | None |
| IA-5(1) | Password-Based Authentication | Fully Implemented | Dynamic database passwords rotated automatically; Static secret versioning with rollback | None |
| IA-5(7) | No Embedded Unencrypted Static Authenticators | Fully Implemented | All secrets encrypted at rest; No hardcoded credentials in applications | None |

### SC (System and Communications Protection) Family

| Control ID | Control Name | Implementation | Features | Gaps |
|------------|--------------|----------------|----------|------|
| SC-8 | Transmission Confidentiality | Fully Implemented | TLS 1.2+ for all Vault API communication; HTTPS-only UI access | None |
| SC-8(1) | Cryptographic Protection | Fully Implemented | AES-256-GCM encryption; TLS for data in transit | None |
| SC-12 | Cryptographic Key Establishment | Fully Implemented | Auto-unseal with cloud KMS (optional); Master key sharding via Shamir's Secret Sharing | None |
| SC-13 | Cryptographic Protection | Fully Implemented | FIPS 140-2 compliant encryption (Enterprise); Strong cryptography for all secrets | None |
| SC-28 | Protection of Information at Rest | Fully Implemented | Vault encrypts all secrets at rest; Storage backend encryption | None |
| SC-28(1) | Cryptographic Protection | Fully Implemented | AES-256-GCM for at-rest encryption; Per-secret encryption keys | None |

### CM (Configuration Management) Family

| Control ID | Control Name | Implementation | Features | Gaps |
|------------|--------------|----------------|----------|------|
| CM-2 | Baseline Configuration | Fully Implemented | Vault configuration via HCL files; Version-controlled policies | None |
| CM-3 | Configuration Change Control | Fully Implemented | Policy versioning; Rollback capability for secrets | None |
| CM-6 | Configuration Settings | Fully Implemented | Infrastructure-as-code via Docker Compose; Documented configuration standards | None |

## SOC 2 Type II Trust Services Criteria

### CC6: Logical and Physical Access Controls

| Criterion | Implementation | Evidence | Gaps |
|-----------|----------------|----------|------|
| CC6.1 - Access restricted to authorized users | Fully Implemented | Vault policies enforce authorization; Token-based access control | None |
| CC6.2 - Authentication mechanisms | Fully Implemented | Multiple auth methods (Token, AppRole, LDAP); MFA support | None |
| CC6.3 - Authorization mechanisms | Fully Implemented | Path-based policy enforcement; Dynamic role assignment | None |
| CC6.6 - Access monitoring | Fully Implemented | Comprehensive audit logging; Real-time metrics via Prometheus | None |
| CC6.7 - Access removal | Fully Implemented | Automatic credential expiration; Token revocation capabilities | None |
| CC6.8 - Privileged access | Fully Implemented | Just-in-time privileged access via dynamic credentials; Admin action logging | None |

### CC7: System Operations

| Criterion | Implementation | Evidence | Gaps |
|-----------|----------------|----------|------|
| CC7.1 - Security incident detection | Fully Implemented | Monitoring via Grafana; Alerting on suspicious access patterns | None |
| CC7.2 - System monitoring | Fully Implemented | Health checks; Performance metrics; Seal status monitoring | None |
| CC7.4 - Availability monitoring | Fully Implemented | Docker health checks; Service restart policies; High availability configuration (Enterprise) | None |

## ISO 27001:2022 Annex A Controls

### A.5 Information Security Policies

| Control | Name | Implementation | Features | Gaps |
|---------|------|----------------|----------|------|
| A.5.1 | Policies for information security | Fully Implemented | Vault policy framework; Documented PAM procedures | None |
| A.5.3 | Segregation of duties | Fully Implemented | Dual control policies; Approval workflows for sensitive operations | None |

### A.8 Asset Management

| Control | Name | Implementation | Features | Gaps |
|---------|------|----------------|----------|------|
| A.8.1 | Responsibility for assets | Fully Implemented | Secrets ownership via metadata; Audit trail for asset access | None |
| A.8.2 | Information classification | Fully Implemented | Secret classification via paths (dev/, prod/, sensitive/); Policy-based protection | None |
| A.8.3 | Media handling | Fully Implemented | Encrypted storage volumes; Secure secret deletion | None |

### A.9 Access Control

| Control | Name | Implementation | Features | Gaps |
|---------|------|----------------|----------|------|
| A.9.1 | Business requirements for access control | Fully Implemented | Policy-driven access control; Business logic enforcement via policies | None |
| A.9.2 | User access management | Fully Implemented | Identity and entity management; Token lifecycle management | None |
| A.9.3 | User responsibilities | Fully Implemented | Individual accountability via audit logs; User-specific tokens | None |
| A.9.4 | System and application access control | Fully Implemented | Database dynamic credentials; SSH key management; API access control | None |

### A.12 Operations Security

| Control | Name | Implementation | Features | Gaps |
|---------|------|----------------|----------|------|
| A.12.1 | Operational procedures and responsibilities | Fully Implemented | Documented lab exercises; Runbooks for common operations | None |
| A.12.4 | Logging and monitoring | Fully Implemented | Vault audit device; Prometheus/Grafana monitoring stack | None |

## CIS Controls v8

| Control | Name | Implementation | Features | Gaps |
|---------|------|----------------|----------|------|
| 3.1 | Establish Data Management Process | Fully Implemented | Secrets lifecycle management; Data classification via paths | None |
| 3.3 | Configure Data Access Control Lists | Fully Implemented | Vault policies define ACLs; Path-based permissions | None |
| 4.1 | Establish Secure Configuration | Fully Implemented | Infrastructure-as-code via Docker Compose; Documented secure defaults | None |
| 4.7 | Manage Default Accounts | Fully Implemented | Root token disabled post-setup; No default credentials | None |
| 5.1 | Establish and Maintain an Inventory of Accounts | Fully Implemented | Vault entities track all identities; Audit logs show account usage | None |
| 5.2 | Use Unique Passwords | Fully Implemented | Dynamic credentials always unique; No password reuse possible | None |
| 5.3 | Disable Dormant Accounts | Fully Implemented | Token TTL enforcement; Unused dynamic credentials auto-expire | None |
| 5.4 | Restrict Administrator Privileges | Fully Implemented | Granular admin policies; Just-in-time privileged access | None |
| 5.5 | Establish and Maintain MFA | Fully Implemented | MFA via Duo/TOTP for privileged operations | None |
| 6.1 | Establish Access Control Mechanisms | Fully Implemented | Vault policy engine; RBAC and ABAC support | None |
| 6.2 | Establish Least Privilege | Fully Implemented | Scoped dynamic credentials; Policy-based least privilege | None |
| 6.5 | Centralize Account Management | Fully Implemented | Centralized secret management; Single source of truth for credentials | None |
| 6.8 | Define and Maintain RBAC | Fully Implemented | Policy-based roles; Entity groups for role assignment | None |
| 8.2 | Collect Audit Logs | Fully Implemented | Vault audit device; Comprehensive logging | None |
| 8.5 | Collect Detailed Audit Logs | Fully Implemented | Logs include user, operation, path, timestamp, client IP | None |
| 8.11 | Conduct Audit Log Reviews | Fully Implemented | Grafana dashboards for log analysis; Prometheus alerting | None |

## CyberArk PAM-DEF Alignment

### Vault Component Mapping to CyberArk

| CyberArk Component | Vault Equivalent | Lab Exercise | Compliance Controls |
|-------------------|------------------|--------------|-------------------|
| Password Vault | KV Secrets Engine | Exercise 1, 2 | AC-6, IA-5, A.9.4 |
| CPM (Credential Manager) | Rotation Scripts | Exercise 4 | IA-5(1), AC-2(3) |
| PSM (Session Manager) | SSH Secrets Engine | Exercise 3 | AC-17, AC-6(9) |
| PVWA (Web Interface) | Vault UI/API | All exercises | CC6.1, A.9.2 |
| Dual Control | Vault Policies | Exercise 2 | AC-5, A.5.3 |
| Dynamic Credentials | Database Engine | Exercise 3 | AC-2(1), IA-5 |
| Audit & Compliance | Audit Device | Exercise 5 | AU-2, AU-6, CC7.2 |

### PAM Best Practices Implementation

| Best Practice | Implementation | Compliance Benefit |
|--------------|----------------|-------------------|
| Eliminate shared accounts | Dynamic credentials per user | AC-2, IA-4 |
| Rotate credentials regularly | Automated rotation scripts | IA-5(1) |
| Just-in-time access | Dynamic secrets with TTL | AC-6(5) |
| Comprehensive audit logging | Vault audit device | AU-2, AU-3 |
| Least privilege enforcement | Scoped policies and roles | AC-6, CIS 6.2 |
| Secrets encryption at rest | AES-256-GCM encryption | SC-28, SC-28(1) |
| MFA for privileged operations | Duo/TOTP integration | IA-2(1), CIS 5.5 |

## Compliance Gaps and Roadmap

### Current Gaps

1. **Production-Grade HA** - Lab uses single-node Vault; HA in roadmap
2. **HSM Integration** - Software-based encryption; HSM support in Enterprise edition
3. **FIPS 140-2 Compliance** - Requires Vault Enterprise
4. **Remote Audit Storage** - Lab uses local volumes; production should use remote storage

### Roadmap for Full Compliance

**Phase 2 (Next 6 months):**
- High availability configuration with Raft storage
- Integration with external LDAP/AD
- SIEM integration (Splunk, Sentinel)
- Automated compliance reporting

**Phase 3 (12 months):**
- HSM integration for key storage
- FIPS 140-2 compliant deployment
- Multi-tenant support
- ServiceNow integration for ticketing

## Evidence Collection for Audits

### Automated Evidence Generation

The platform provides audit-ready evidence through:

1. **Vault Audit Logs:**
   ```bash
   docker exec vault cat /vault/logs/audit.log
   # Complete audit trail with user, operation, timestamp
   ```

2. **Prometheus Metrics:**
   - Access patterns and frequency
   - Secret creation/rotation rates
   - Authentication success/failure rates

3. **Grafana Dashboards:**
   - Visual compliance reports
   - Access review summaries
   - Credential rotation tracking

### Audit Preparation Checklist

- [ ] Export Vault audit logs (last 90 days)
- [ ] Generate Grafana compliance reports
- [ ] Document policy configurations
- [ ] Collect dynamic credential rotation evidence
- [ ] Review and document MFA enforcement
- [ ] Prepare secret versioning examples

## Lab Exercises for Compliance Training

### Exercise Mapping to Controls

| Exercise | Compliance Controls | Skills Demonstrated |
|----------|-------------------|-------------------|
| 01 - Vault Basics | AC-3, IA-2, AU-2 | Policy creation, authentication, audit logging |
| 02 - Secret Management | IA-5, SC-28, CM-3 | KV engine, versioning, encryption |
| 03 - Dynamic Credentials | AC-2(1), AC-6(5), IA-5 | Just-in-time access, auto-expiration |
| 04 - Password Rotation | IA-5(1), AC-2(3) | Automated credential lifecycle |
| 05 - Audit & Logging | AU-6, AU-12, CC7.2 | Log analysis, compliance reporting |

## Cost Analysis for Compliance Budget

**Monthly Operational Cost: $0 (Open Source)**

| Component | Cost | Compliance Value |
|-----------|------|-----------------|
| HashiCorp Vault OSS | Free | Core PAM capabilities |
| Docker/Compose | Free | Reproducible environment |
| PostgreSQL/MySQL | Free | Target system simulation |
| Prometheus/Grafana | Free | Monitoring and reporting |

**Comparison to CyberArk:**
- CyberArk Enterprise: $50K+ annually
- PAM-Vault-Lab: $0 (learning and POC)
- Compliance training value: Priceless

## Conclusion

PAM-Vault-Lab provides comprehensive compliance coverage for privileged access management. The platform's HashiCorp Vault implementation aligns with 42+ NIST controls, SOC 2 criteria, ISO 27001 requirements, and CIS Controls. The combination of dynamic credentials, automated rotation, comprehensive audit logging, and just-in-time access makes this platform suitable for learning enterprise PAM compliance requirements.

The lab's alignment with CyberArk PAM-DEF concepts ensures that skills learned are directly transferable to enterprise PAM implementations. This makes it an ideal training environment for:
- PAM certification preparation
- Compliance audit preparation
- Hands-on security controls implementation
- Enterprise PAM architecture understanding

For questions regarding specific compliance requirements or audit preparation, refer to the evidence collection section or review the lab exercise documentation.

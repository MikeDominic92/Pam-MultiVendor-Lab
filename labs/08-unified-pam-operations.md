# Lab 08: Unified PAM Operations

## Lab Title and Overview

**Unified PAM Client: A Multi-Platform Abstraction Layer**

This lab demonstrates how to leverage the unified PAM client to abstract away platform-specific complexity and provide a consistent interface for managing secrets across multiple platforms. You'll learn how to detect available platforms, perform health checks, retrieve secrets from different sources, and identify duplicate credentials across your infrastructure.

The unified PAM client is designed to reduce operational complexity by providing a single point of interaction for multiple PAM platforms (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, CyberArk, etc.), enabling you to scale secret management without learning each platform's unique API.

---

## Prerequisites

* Access to the pam-vault-lab environment (labs 01-07 completed recommended)
* Python 3.8 or higher installed
* The unified PAM client configured with platform credentials
* At least two PAM platforms accessible (Vault and one cloud provider)
* Basic understanding of secret management concepts
* CLI access with appropriate permissions

---

## Learning Objectives

By completing this lab, you will be able to:

* Detect and list all available PAM platforms in your environment
* Perform health checks across multiple platforms simultaneously
* Retrieve secrets from different platforms using a unified interface
* Compare secrets across platforms to identify inconsistencies
* Create and manage unified secrets across multiple backends
* Identify and report on duplicate secrets across platforms
* Design custom integrations for platform-specific workflows

---

## Lab Duration

**30 minutes** (additional 15 minutes for bonus exercise)

---

## Exercises

### Exercise 1: Detect Available Platforms

**Objective:** Discover which PAM platforms are available and accessible in your environment.

**Steps:**

1. Open a terminal and navigate to the lab directory:

```bash
cd ~/pam-vault-lab
```

2. Run the platform detection command:

```bash
python scripts/unified_pam_client.py detect-platforms
```

3. Expected output should list:
   * Platform name (e.g., "hashicorp-vault", "aws-secrets-manager", "azure-key-vault")
   * Connection status (CONNECTED, DISCONNECTED, UNREACHABLE)
   * Platform version
   * Configuration source (environment, config file, default)
   * Last health check timestamp

4. Document the platforms available in your environment:

```
Platform 1: _____________________ | Status: ___________________
Platform 2: _____________________ | Status: ___________________
Platform 3: _____________________ | Status: ___________________
```

5. Verify connectivity to at least two platforms before proceeding.

---

### Exercise 2: Health Check All Platforms

**Objective:** Validate that all available platforms are healthy and operational.

**Steps:**

1. Run the unified health check command:

```bash
python scripts/unified_pam_client.py health-check
```

2. Review the health report, which should include:
   * Overall system health status
   * Individual platform status (HEALTHY, DEGRADED, FAILED)
   * Response time for each platform (in milliseconds)
   * Last successful authentication for each platform
   * Storage capacity and usage (where applicable)
   * Certificate expiration dates (for platforms using SSL/TLS)

3. For any platform showing DEGRADED or FAILED status, investigate:

```bash
python scripts/unified_pam_client.py health-check --verbose --platform <platform-name>
```

4. Document findings:

| Platform | Status | Response Time | Last Auth | Issues |
|----------|--------|----------------|-----------|--------|
| | | | | |
| | | | | |
| | | | | |

5. Verify all critical platforms show HEALTHY status before proceeding.

---

### Exercise 3: Get Secrets from Different Platforms

**Objective:** Retrieve secrets from different platforms using the unified client.

**Steps:**

1. Retrieve a secret from HashiCorp Vault:

```bash
python scripts/unified_pam_client.py get-secret \
  --platform hashicorp-vault \
  --path secret/data/database/prod \
  --key password
```

2. Retrieve the same secret from AWS Secrets Manager:

```bash
python scripts/unified_pam_client.py get-secret \
  --platform aws-secrets-manager \
  --path prod/database \
  --key password
```

3. Retrieve a secret from Azure Key Vault:

```bash
python scripts/unified_pam_client.py get-secret \
  --platform azure-key-vault \
  --path vault-name \
  --secret-name db-password
```

4. Compare retrieval times and methods across platforms:

```bash
python scripts/unified_pam_client.py get-secret \
  --platform all \
  --path secret/data/database/prod \
  --timing
```

5. Document the retrieval results:

```
Vault Retrieval Time: ________ ms
AWS Retrieval Time: _________ ms
Azure Retrieval Time: ________ ms

Fastest Platform: _______________________
Most Reliable: _______________________
```

---

### Exercise 4: Compare Secrets Across Platforms

**Objective:** Identify differences and inconsistencies between secrets stored in different platforms.

**Steps:**

1. Create a comparison report for a specific secret across all platforms:

```bash
python scripts/unified_pam_client.py compare-secrets \
  --secret-name database-password \
  --platforms hashicorp-vault,aws-secrets-manager,azure-key-vault \
  --output-format json
```

2. Analyze the comparison output, which should show:
   * Secret value (hash for security)
   * Last updated timestamp
   * Version number
   * Metadata differences
   * Expiration dates (if applicable)

3. Run a broader comparison to detect all secrets present in multiple platforms:

```bash
python scripts/unified_pam_client.py compare-secrets \
  --mode multi-platform \
  --output-format report
```

4. Examine the report for:
   * Secrets present in all platforms
   * Secrets present in some platforms only
   * Version mismatches
   * Timestamp discrepancies

5. Document any inconsistencies found:

```
Secret Name: _______________________
Platform A Value Hash: _____________
Platform B Value Hash: _____________
Match: [YES/NO]
Last Updated: A: _____ B: _____
Recommendation: _____________________
```

---

### Exercise 5: Create Unified Secrets

**Objective:** Create a new secret across multiple platforms simultaneously using the unified client.

**Steps:**

1. Create a new secret definition in JSON format:

```bash
cat > /tmp/new_secret.json << 'EOF'
{
  "name": "lab-api-key",
  "platforms": ["hashicorp-vault", "aws-secrets-manager"],
  "value": "sk_test_lab_$(date +%s)",
  "metadata": {
    "owner": "security-team",
    "environment": "lab",
    "rotation-interval": "90 days"
  },
  "vault_path": "secret/data/api/test",
  "aws_path": "lab/api-key"
}
EOF
```

2. Create the secret across specified platforms:

```bash
python scripts/unified_pam_client.py create-secret \
  --config /tmp/new_secret.json \
  --mode synchronous
```

3. Verify the secret was created in all platforms:

```bash
python scripts/unified_pam_client.py verify-secret \
  --name lab-api-key \
  --platforms all
```

4. Retrieve the secret from each platform to confirm:

```bash
python scripts/unified_pam_client.py get-secret \
  --platform hashicorp-vault \
  --path secret/data/api/test
```

5. Verify creation success:

```
Secret Created: [YES/NO]
Vault Status: ___________________
AWS Status: _____________________
Azure Status: ___________________
```

---

### Exercise 6: Find Duplicates Across Platforms

**Objective:** Identify duplicate secrets across platforms that should be consolidated.

**Steps:**

1. Scan all platforms for potential duplicate secrets:

```bash
python scripts/unified_pam_client.py find-duplicates \
  --sensitivity medium \
  --output-format json
```

2. The command will analyze:
   * Exact value matches (high confidence duplicates)
   * Similar names with identical values (medium confidence)
   * Secrets with overlapping metadata (low confidence)

3. Review the duplicate report:

```bash
python scripts/unified_pam_client.py find-duplicates \
  --sensitivity high \
  --show-details
```

4. Generate a consolidation recommendation report:

```bash
python scripts/unified_pam_client.py find-duplicates \
  --sensitivity high \
  --generate-consolidation-plan \
  --output consolidation_plan.txt
```

5. Analyze the report:

```
Total Secrets Scanned: _______
High Confidence Duplicates: _______
Medium Confidence Duplicates: _______
Consolidation Opportunities: _______

Duplicate Set 1:
  - Platform A: path/to/secret1
  - Platform B: path/to/secret1
  Recommendation: Keep in [PRIMARY], Deprecate in [SECONDARY]

Duplicate Set 2:
  ...
```

6. Review the consolidation plan before implementing any changes.

---

### Bonus Exercise: Build a Custom Integration

**Objective:** Create a custom integration that extends the unified PAM client.

**Steps:**

1. Create a new integration module:

```bash
cat > /tmp/custom_integration.py << 'EOF'
from unified_pam_client import BasePlatformIntegration

class CustomIntegration(BasePlatformIntegration):
    """Custom integration for specialized secret management"""

    def __init__(self, config):
        super().__init__(config)
        self.platform_name = "custom-vault"

    def authenticate(self):
        """Implement custom authentication logic"""
        # Your authentication code here
        pass

    def get_secret(self, path, key=None):
        """Retrieve a secret from custom platform"""
        # Your retrieval logic here
        pass

    def set_secret(self, path, value, metadata=None):
        """Store a secret in custom platform"""
        # Your storage logic here
        pass

    def health_check(self):
        """Implement custom health check"""
        return {
            "status": "healthy",
            "version": "1.0",
            "response_time_ms": 42
        }
EOF
```

2. Register the custom integration:

```bash
python scripts/unified_pam_client.py register-integration \
  --module /tmp/custom_integration.py \
  --platform-name custom-vault
```

3. Test the integration:

```bash
python scripts/unified_pam_client.py health-check \
  --platform custom-vault
```

4. Use the custom integration with the unified client:

```bash
python scripts/unified_pam_client.py get-secret \
  --platform custom-vault \
  --path custom/secret/path
```

5. Document the integration in your team's internal wiki.

---

## Benefits of Unified Abstraction

### Operational Efficiency

* Single command syntax for all platforms eliminates context switching
* Reduced training time for new team members
* Faster secret operations without platform-specific knowledge
* Consolidated logging and monitoring

### Scalability

* Add new PAM platforms without changing application code
* Scale operations across cloud providers and on-premises systems
* Distribute secrets across platforms for high availability
* Seamlessly migrate secrets between platforms

### Consistency

* Standardized secret naming conventions across platforms
* Unified metadata and tagging across all backends
* Consistent authentication and authorization policies
* Single source of truth for secret inventory

### Cost Optimization

* Identify and eliminate duplicate secrets to reduce storage costs
* Right-size secrets across platforms based on usage patterns
* Optimize retrieval patterns to minimize API calls
* Balance cost vs. performance across platforms

### Security

* Centralized audit logging across all platforms
* Unified access control policies
* Consistent encryption standards
* Simplified compliance reporting

---

## Key Takeaways

1. **Abstraction Reduces Complexity:** The unified PAM client shields you from platform-specific APIs and quirks, allowing you to focus on security policies rather than implementation details.

2. **Detection and Monitoring:** Regular health checks and platform detection prevent surprises and ensure consistent availability across your secret management infrastructure.

3. **Data Consistency:** Comparing secrets across platforms reveals gaps and inconsistencies that could lead to operational issues or security vulnerabilities.

4. **Consolidation Drives Value:** Identifying and consolidating duplicate secrets reduces operational overhead and improves security posture.

5. **Extensibility is Critical:** Custom integrations enable you to incorporate specialized platforms while maintaining the benefits of unified abstraction.

6. **Single Interface, Multiple Backends:** The ability to work with all platforms through one consistent interface is a powerful multiplier for team productivity.

---

## Real-World Application Scenarios

### Scenario 1: Multi-Cloud Secret Management

**Challenge:** Your organization uses AWS, Azure, and Google Cloud. Each team manages secrets independently, leading to inconsistencies and redundant storage.

**Solution:** Deploy the unified PAM client as a central secret proxy that automatically synchronizes secrets across all cloud providers, ensuring consistency and enabling teams to work with a single interface.

**Commands:**
```bash
# Automatically sync secrets across all cloud providers
python scripts/unified_pam_client.py sync-secrets \
  --source aws-secrets-manager \
  --targets azure-key-vault,gcp-secret-manager \
  --filter environment=production
```

### Scenario 2: Legacy System Integration

**Challenge:** Your organization has HashiCorp Vault but also legacy applications that use CyberArk PAM. You need to unify secret management without disrupting existing systems.

**Solution:** Use the unified client to create a bridge layer that retrieves secrets from either platform and presents them uniformly to applications.

**Commands:**
```bash
# Retrieve secrets from either platform with fallback
python scripts/unified_pam_client.py get-secret \
  --name database-password \
  --platforms hashicorp-vault,cyberark \
  --fallback-enabled
```

### Scenario 3: Compliance and Audit

**Challenge:** Auditors require a complete inventory of all secrets across your infrastructure and proof that they're encrypted and rotated properly.

**Solution:** Use the unified client to generate comprehensive audit reports that span all platforms.

**Commands:**
```bash
# Generate compliance audit report
python scripts/unified_pam_client.py audit-report \
  --platforms all \
  --format compliance \
  --include-rotation-history \
  --output audit_report_$(date +%Y%m%d).pdf
```

### Scenario 4: Cost Optimization

**Challenge:** Your organization is spending money on duplicate secrets stored across multiple platforms.

**Solution:** Use the unified client to identify and consolidate duplicates, reducing storage costs and improving maintainability.

**Commands:**
```bash
# Identify duplicates and estimate cost savings
python scripts/unified_pam_client.py find-duplicates \
  --calculate-cost-savings \
  --output-format detailed
```

### Scenario 5: Disaster Recovery

**Challenge:** A secrets platform goes offline, and applications need to fail over to a secondary platform.

**Solution:** Configure the unified client with multiple platforms and let it handle failover automatically.

**Commands:**
```bash
# Enable automatic failover for critical secrets
python scripts/unified_pam_client.py configure-failover \
  --primary hashicorp-vault \
  --secondary aws-secrets-manager \
  --health-check-interval 30s
```

---

## Lab Completion Checklist

* [ ] Successfully detected all available platforms in your environment
* [ ] Performed health checks on at least two platforms
* [ ] Retrieved secrets from different platforms using the unified interface
* [ ] Compared secrets across platforms and identified inconsistencies
* [ ] Created a new unified secret across multiple platforms
* [ ] Found and documented duplicate secrets in your environment
* [ ] (Bonus) Built and tested a custom integration
* [ ] Documented findings and recommendations for your team

---

**Author:** Dominic M. Hoang

**Last Updated:** 2026-01-19

**Version:** 1.0

For questions or issues, contact the security team or refer to the unified PAM client documentation.

# ADR-001: Using HashiCorp Vault Instead of CyberArk for Home Lab

**Status:** Accepted
**Date:** 2025-11-30
**Decision Makers:** Mike Dominic
**Context:** PAM-DEF certification preparation

## Context and Problem Statement

I need a Privileged Access Management (PAM) solution for home lab practice to prepare for the CyberArk PAM-DEF certification. The lab must provide hands-on experience with PAM concepts including:

- Secrets management
- Password rotation (CPM equivalent)
- Access control and policies
- Audit logging
- Dynamic credentials

## Decision Drivers

1. **Cost:** Must be free or very low cost for home lab
2. **Learning Value:** Should teach transferable PAM concepts
3. **Practicality:** Must run on consumer hardware
4. **Certification Alignment:** Concepts should map to CyberArk PAM
5. **Career Value:** Skills should be marketable

## Considered Options

### Option 1: CyberArk Community Edition

**Pros:**
- Exact product for certification
- Direct exam alignment
- Official CyberArk experience

**Cons:**
- Not available for individual use
- Requires enterprise licensing contact
- Hardware requirements exceed home lab capacity
- Complex installation requiring Windows Server infrastructure
- Limited learning license availability

**Cost:** Not available / Estimated $50,000+ annually for enterprise

### Option 2: HashiCorp Vault Open Source

**Pros:**
- Completely free and open source
- Runs on Docker (minimal resources)
- Active community and documentation
- API-first architecture (modern approach)
- Teaches core PAM concepts
- Industry-standard tool (marketable skill)
- Similar architecture to CyberArk
- Excellent for IAM portfolio

**Cons:**
- Not exact CyberArk product
- Requires concept mapping to CyberArk terminology
- No PSM (session management) equivalent
- Different UI/UX

**Cost:** $0

### Option 3: Delinea (Thycotic) Secret Server

**Pros:**
- PAM competitor to CyberArk
- Similar feature set
- Free trial available

**Cons:**
- 30-day trial only
- Windows-based (resource intensive)
- Limited to trial features
- Less community support than Vault

**Cost:** Trial only / $5,000+ for licensing

### Option 4: Keeper Security

**Pros:**
- Cloud-based (no infrastructure)
- Modern UI
- Free tier available

**Cons:**
- Consumer/SMB focused
- Limited enterprise PAM features
- Doesn't align with CyberArk architecture
- Less relevant for certification

**Cost:** Free tier limited / $45/user/year

## Decision Outcome

**Chosen option:** HashiCorp Vault Open Source

### Rationale

1. **Zero Cost:** Completely free for unlimited use
2. **Concept Transfer:** Core PAM concepts map directly to CyberArk:
   - Vault KV v2 → CyberArk Safes
   - Vault Policies → Safe Permissions
   - Database Secrets Engine → Dynamic Credentials
   - Static Roles + Rotation → CPM
   - Audit Device → Audit Vault
   - Tokens → PVWA Sessions

3. **Practical:** Runs on Docker with minimal resources (8GB RAM sufficient)
4. **Marketable:** Vault skills are highly valued (HashiCorp is industry leader)
5. **Portfolio Value:** Demonstrates cloud-native PAM understanding
6. **Learning:** Teaches infrastructure-as-code approach to PAM

### Concept Mapping

| CyberArk Component | HashiCorp Vault Equivalent | Learning Value |
|-------------------|---------------------------|----------------|
| PVWA (Web Access) | Vault UI / API | Authentication, Authorization |
| CPM (Password Manager) | Database Secrets + Rotation | Automated rotation |
| PSM (Session Manager) | SSH Secrets Engine* | Credential injection |
| EPV (Enterprise Vault) | KV Secrets Engine v2 | Secret storage, versioning |
| Safe | KV Path or Mount Point | Logical grouping |
| Safe Permissions | Vault Policies | Access control |
| Dual Control | Check-and-Set (CAS) | Concurrent access |
| Password History | Secret Versioning | Rollback capability |
| Dynamic Privileges | Dynamic Secrets | Just-in-time credentials |

*Note: Vault SSH is limited compared to CyberArk PSM which includes session recording

### Exam Preparation Strategy

1. **Understand Concepts:** Learn PAM principles using Vault
2. **Map to CyberArk:** Study how Vault concepts translate
3. **CyberArk Documentation:** Read official docs for terminology
4. **Practice Labs:** Use Vault for hands-on muscle memory
5. **Exam Focus:** Memorize CyberArk-specific features not in Vault

## Consequences

### Positive

- Gain practical PAM experience at zero cost
- Build marketable skills (Vault + CyberArk knowledge)
- Create impressive portfolio project
- Understand PAM architecture deeply
- Prepare for modern cloud-native IAM roles

### Negative

- Must study CyberArk-specific features separately:
  - PSM session management and recording
  - Windows authentication integration
  - CyberArk-specific terminology
  - PVWA UI navigation
  - Platform management specifics

### Mitigation

- Study CyberArk documentation alongside Vault practice
- Use CyberArk trial/demo videos for UI familiarity
- Focus exercises on concepts that map 1:1
- Document differences explicitly
- Create CyberArk terminology reference

## Validation

This decision will be validated by:

1. Successfully passing CyberArk PAM-DEF certification
2. Positive feedback on portfolio project from recruiters
3. Ability to discuss both Vault and CyberArk in interviews
4. Completion of all lab exercises with concept mastery

## References

- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [CyberArk PAM-DEF Exam](https://www.cyberark.com/services-support/technical-education/defender-exam/)
- [Vault vs CyberArk Comparison](../CYBERARK_CONCEPTS.md)
- [Cost Analysis](../COST_ANALYSIS.md)

## Revision History

- 2025-11-30: Initial decision - chose HashiCorp Vault

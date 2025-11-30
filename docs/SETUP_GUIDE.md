# PAM-Vault-Lab Setup Guide

Complete installation and configuration guide for the PAM-Vault-Lab.

## Prerequisites

### Required Software

1. **Docker Desktop**
   - Version: 20.10 or later
   - Download: https://www.docker.com/products/docker-desktop

2. **Git**
   - Version: 2.x or later
   - Download: https://git-scm.com/downloads

3. **Web Browser**
   - Chrome, Firefox, Safari, or Edge (latest version)

### Optional Software

4. **Python 3.9+** (for automation scripts)
   - Download: https://www.python.org/downloads/

5. **PowerShell 7+** (for Windows automation)
   - Download: https://github.com/PowerShell/PowerShell/releases

6. **Ansible 2.10+** (for playbooks)
   - Install: `pip install ansible`

### Hardware Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 8GB
- Storage: 20GB free

**Recommended:**
- CPU: 4 cores
- RAM: 16GB
- Storage: 50GB free

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/MikeDominic92/pam-vault-lab.git
cd pam-vault-lab
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your preferred settings (optional - defaults work fine)
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

### Step 3: Start Lab Environment

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected Output:**
```
NAME                COMMAND                  SERVICE             STATUS
vault               "docker-entrypoint.s…"   vault               running
postgres-target     "docker-entrypoint.s…"   postgres            running
mysql-target        "docker-entrypoint.s…"   mysql               running
ssh-target          "/usr/sbin/sshd -D -…"   ssh-target          running
prometheus          "/bin/prometheus --c…"   prometheus          running
grafana             "/run.sh"                grafana             running
```

### Step 4: Initialize Vault

```bash
# Run initialization script
docker exec -it vault sh /scripts/init-vault.sh
```

**IMPORTANT:** Save the output! It contains:
- Root token
- Sample tokens (admin, readonly, rotation)

### Step 5: Access Vault UI

1. Open browser: http://localhost:8200
2. Sign in with root token from Step 4
3. Explore the UI

### Step 6: Configure Secrets Engines

```bash
# Enable and configure database secrets engines
docker exec -it vault sh /scripts/enable-secrets-engines.sh

# Setup password rotation
docker exec -it vault sh /scripts/setup-database-rotation.sh
```

### Step 7: Verify Installation

```bash
# Test Vault connectivity
curl http://localhost:8200/v1/sys/health

# Test PostgreSQL
docker exec postgres-target pg_isready -U vaultadmin

# Test MySQL
docker exec mysql-target mysqladmin ping -u root -prootpass123

# Test SSH
ssh -p 2222 privileged@localhost  # Password: changeme123
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Vault UI | http://localhost:8200 | Token from init script |
| Prometheus | http://localhost:9090 | No auth |
| Grafana | http://localhost:3000 | admin / admin |
| PostgreSQL | localhost:5432 | vaultadmin / vaultpass123 |
| MySQL | localhost:3306 | root / rootpass123 |
| SSH Target | localhost:2222 | privileged / changeme123 |

## Troubleshooting

### Issue: Vault container won't start

**Symptoms:**
```
Error: vault exited with code 1
```

**Solution:**
```bash
# Check logs
docker-compose logs vault

# Common fix: Remove old data
docker-compose down -v
docker-compose up -d
```

### Issue: Port already in use

**Symptoms:**
```
Error: Bind for 0.0.0.0:8200 failed: port is already allocated
```

**Solution:**
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :8200

# Mac/Linux:
lsof -i :8200

# Either stop the conflicting service or change port in .env
```

### Issue: Database won't connect

**Symptoms:**
```
Error: connection refused
```

**Solution:**
```bash
# Check database is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue: Cannot access Vault UI

**Symptoms:**
- Browser shows "Can't reach this page"

**Solution:**
```bash
# Verify Vault is running
docker ps | grep vault

# Check health endpoint
curl http://localhost:8200/v1/sys/health

# Restart Vault
docker-compose restart vault
```

### Issue: Vault is sealed

**Symptoms:**
```
Error: Vault is sealed
```

**Solution:**
```bash
# In dev mode, Vault should auto-unseal
# If using production mode, unseal with keys:
docker exec -it vault vault operator unseal <unseal-key>
# Repeat 3 times with different keys
```

### Issue: Python tests failing

**Symptoms:**
```
ModuleNotFoundError: No module named 'hvac'
```

**Solution:**
```bash
# Install Python dependencies
pip install -r automation/python/requirements.txt

# Verify installation
python -c "import hvac; print(hvac.__version__)"
```

### Issue: Permission denied on scripts

**Symptoms:**
```
Permission denied: /scripts/init-vault.sh
```

**Solution:**
```bash
# Make scripts executable
chmod +x vault/scripts/*.sh
```

## Updating the Lab

### Update Docker Images

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose down
docker-compose up -d
```

### Update Lab Files

```bash
# Pull latest changes
git pull origin main

# Restart services
docker-compose down
docker-compose up -d
```

## Uninstalling

### Remove Containers and Volumes

```bash
# Stop and remove everything
docker-compose down -v

# Remove images (optional)
docker rmi hashicorp/vault:1.15
docker rmi postgres:15-alpine
docker rmi mysql:8.0
```

### Remove Lab Directory

```bash
# Navigate to parent directory
cd ..

# Remove lab
rm -rf pam-vault-lab  # Mac/Linux
# or
rmdir /s pam-vault-lab  # Windows
```

## Advanced Configuration

### Using Production Vault Configuration

Edit `vault/config/vault.hcl` and change docker-compose.yml:

```yaml
# Remove -dev flag
command: server
```

### Adding More Database Targets

Edit `docker-compose.yml`:

```yaml
services:
  oracle:
    image: container-registry.oracle.com/database/express:latest
    # ... configuration
```

### Enabling HTTPS

1. Generate certificates
2. Update `vault/config/vault.hcl`
3. Update docker-compose volume mounts

### Custom Rotation Periods

Edit static role configuration:

```bash
vault write database/static-roles/custom \
    rotation_period="12h"  # Rotate every 12 hours
```

## Next Steps

1. Complete [Exercise 1: Vault Basics](../exercises/01-vault-basics.md)
2. Explore [CyberArk Concepts Mapping](CYBERARK_CONCEPTS.md)
3. Review [Security Best Practices](SECURITY.md)
4. Try automation scripts in `automation/` directory

## Getting Help

- Check [exercises/](../exercises/) for step-by-step guides
- Review [CONTRIBUTING.md](../CONTRIBUTING.md) for community guidelines
- Open an issue on GitHub: https://github.com/MikeDominic92/pam-vault-lab/issues
- Read Vault documentation: https://www.vaultproject.io/docs

## Quick Commands Reference

```bash
# Start lab
docker-compose up -d

# Stop lab
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart vault

# Access Vault CLI
docker exec -it vault sh

# Run Python script
python automation/python/vault_client.py get --path secret/database/prod

# Run Ansible playbook
cd automation/ansible
ansible-playbook playbooks/setup-vault.yml

# Run PowerShell script
pwsh automation/powershell/Get-VaultSecrets.ps1 -SecretPath "secret/database/prod"

# Run tests
pytest tests/ -v
```

---

**You're all set!** Start with Exercise 1 and begin your PAM journey.

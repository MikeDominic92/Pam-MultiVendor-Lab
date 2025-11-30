# Contributing to PAM-Vault-Lab

First off, thank you for considering contributing to PAM-Vault-Lab! This project aims to help IAM professionals learn PAM concepts, and your contributions make it better for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (OS, Docker version, etc.)
- **Logs** (sanitized of any sensitive data)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear, descriptive title**
- **Provide detailed description** of the proposed functionality
- **Explain why this would be useful** to most users
- **List examples** of how it would work

### Adding Lab Exercises

We welcome new exercises! Please ensure:

1. Exercise follows existing format (see `exercises/` directory)
2. All commands are tested and work
3. Step-by-step instructions are clear
4. Includes expected outputs
5. Maps to CyberArk PAM concepts where applicable

### Code Contributions

#### Pull Request Process

1. **Fork the repo** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Test Docker setup
   docker-compose down -v
   docker-compose up -d

   # Test Python scripts
   cd tests
   pytest

   # Test automation
   cd automation/ansible
   ansible-playbook playbooks/setup-vault.yml --check
   ```

4. **Update documentation**
   - Update README.md if adding features
   - Add entries to CHANGELOG.md
   - Update relevant exercise files

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   ```

   Commit message format:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements
   - `Docs:` for documentation
   - `Test:` for test additions

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

   Create PR with:
   - Clear title and description
   - Link to related issues
   - Screenshots if UI changes
   - Checklist of what was tested

#### Code Style Guidelines

**Python**
- Follow PEP 8
- Use type hints
- Add docstrings for functions
- Maximum line length: 100 characters

**PowerShell**
- Use approved verbs (Get-, Set-, New-, etc.)
- Comment-based help for functions
- Use PascalCase for functions

**Bash/Shell**
- Use shellcheck for validation
- Add comments for complex logic
- Use `set -e` for error handling

**HCL (Vault Policies)**
- Indent with 2 spaces
- Add comments explaining permissions
- Group related capabilities

**Ansible**
- Use YAML anchors for reusability
- Add `name:` to all tasks
- Use handlers for service restarts

### Documentation Improvements

Documentation is as important as code! Contributions include:

- Fixing typos or clarifying instructions
- Adding troubleshooting tips
- Creating diagrams or flowcharts
- Translating documentation (future)
- Improving exercise clarity

### Adding Automation Scripts

When contributing automation:

1. **Ansible Playbooks**
   - Use roles for organization
   - Make idempotent (can run multiple times safely)
   - Add tags for selective execution
   - Test with `--check` mode

2. **PowerShell Scripts**
   - Accept parameters
   - Include error handling
   - Add comment-based help
   - Test on Windows 10/11

3. **Python Scripts**
   - Add to `requirements.txt`
   - Handle exceptions
   - Support environment variables
   - Include unit tests

## Project Structure

```
pam-vault-lab/
├── vault/              # Vault-specific configs
├── automation/         # Automation scripts
│   ├── ansible/       # Playbooks
│   ├── powershell/    # Windows scripts
│   └── python/        # Python utilities
├── exercises/          # Lab exercises
├── docs/              # Documentation
├── targets/           # Target systems
└── tests/             # Integration tests
```

## Development Setup

1. **Install prerequisites**
   ```bash
   # Docker Desktop
   # Git
   # Python 3.9+ (optional)
   # Ansible 2.10+ (optional)
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/pam-vault-lab.git
   cd pam-vault-lab
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   ```

4. **Start lab**
   ```bash
   docker-compose up -d
   ```

5. **Make changes and test**

## Testing Checklist

Before submitting PR, verify:

- [ ] Docker compose starts without errors
- [ ] Vault initializes and unseals
- [ ] All services are healthy (`docker-compose ps`)
- [ ] Python scripts run without errors
- [ ] Ansible playbooks execute successfully
- [ ] PowerShell scripts work (if on Windows)
- [ ] Documentation renders correctly
- [ ] No secrets committed (check with `git diff`)
- [ ] `.gitignore` updated if new files added

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Getting Help

- Check [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for common issues
- Search existing issues before creating new ones
- Join discussions in issues and PRs
- Ask questions in issue comments

## Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to README acknowledgments (for significant contributions)

## Questions?

Feel free to open an issue with the `question` label or reach out via GitHub discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making PAM-Vault-Lab better for everyone!

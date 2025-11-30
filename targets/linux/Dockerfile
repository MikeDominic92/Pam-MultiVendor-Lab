# SSH Target Server for PAM Lab
# Alpine Linux with SSH server for practicing privileged access

FROM alpine:3.19

# Install OpenSSH and other utilities
RUN apk add --no-cache \
    openssh \
    openssh-server \
    sudo \
    bash \
    curl \
    vim \
    shadow

# Create privileged user
ARG SSH_USER=privileged
ARG SSH_PASSWORD=changeme123

# Setup user
RUN adduser -D -s /bin/bash ${SSH_USER} && \
    echo "${SSH_USER}:${SSH_PASSWORD}" | chpasswd && \
    echo "${SSH_USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${SSH_USER} && \
    chmod 0440 /etc/sudoers.d/${SSH_USER}

# Configure SSH
RUN ssh-keygen -A && \
    sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Create home directory structure
RUN mkdir -p /home/${SSH_USER}/.ssh && \
    chown -R ${SSH_USER}:${SSH_USER} /home/${SSH_USER}

# Expose SSH port
EXPOSE 22

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD pgrep sshd || exit 1

# Start SSH daemon
CMD ["/usr/sbin/sshd", "-D", "-e"]

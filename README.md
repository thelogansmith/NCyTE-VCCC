# NCyTE Virtual Cybersecurity Career Challenge — Enterprise Network Build

**Team R3 (Team 3, Group 3) | February – April 2026**

> A 12-week enterprise infrastructure project completed as part of the [NCyTE Virtual Cybersecurity Career Challenge (VCCC)](https://www.ncyte.net/career-seekers/career-seeker-resources/virtual-cybersecurity-career-challenge), an NSF-funded program hosted by the National Cybersecurity Training & Education Center at Whatcom Community College. Teams of five design, deploy, and secure a multi-zone network supporting a fictional business — then present the finished product to an audience of cybersecurity professionals.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Network Architecture](#network-architecture)
- [Phase 1 — Network Infrastructure & Routing](#phase-1--network-infrastructure--routing)
- [Phase 2 — Enterprise Services & Identity](#phase-2--enterprise-services--identity)
- [Phase 3 — Monitoring, Analytics & AI Integration](#phase-3--monitoring-analytics--ai-integration)
- [Phase 4 — Security Posture & Compliance](#phase-4--security-posture--compliance)
- [Technology Stack](#technology-stack)
- [Lessons Learned](#lessons-learned)
- [Repository Structure](#repository-structure)
- [About the VCCC](#about-the-vccc)

---

## Project Overview

This repository documents the end-to-end build of an enterprise IT environment completed during the 2026 NCyTE VCCC. The challenge required our team to stand up a fully operational network — from bare virtual machines to production-ready services — that supports a fictional business selling goods and services online.

The infrastructure spans **nine virtual machines** across three trust zones, running a mix of Windows Server 2025, Red Hat Enterprise Linux 10, VyOS, OPNsense, and Kali Linux. Over the course of the challenge, we configured centralized authentication, deployed web and database servers, set up email, built a monitoring stack, and assessed our security posture against the NIST Cybersecurity Framework (CSF 2.0).

**Key accomplishments:**

- Designed and implemented a three-zone defense-in-depth network architecture
- Deployed Active Directory with domain-joined Windows and Linux workstations
- Built a MariaDB-backed relational database with multi-table joins and business queries
- Configured Prometheus + Grafana monitoring across all network zones
- Completed a CSET self-assessment against CSF 2.0 with a documented remediation roadmap
- Deployed a MailEnable-based internal email system with relay architecture

---

## Network Architecture

```

                                            ┌───────────┐
                                            │ Internet  │
                                            └─────┬─────┘
                                                  │
                                                  │
                                      ┌───────────┴───────────┐
                                      │   VyOS Router (WAN)   │──────────┐
                                      |   Eth4: DHCP          |          |
                                      │   Eth5: 172.31.0.2    │          │
                                      └───────────┬───────────┘   ┌──────┴──────┐
                                                  │               │  Kali VM    │
                                                  │               │ 172.31.0.100│
                                                  │               └─────────────┘
                                     ┌────────────┴────────────┐  
                                     │   OPNsense Firewall     │
                                     │                         │
                                     │  net0 WAN:  172.31.0.1  │
                                     │  net1 DMZ:  10.0.1.1    │
                                     │  net2 LAN:  192.168.2.2 │
                                     └──┬──────────────────┬───┘
                                        │                  │
                         ┌──────────────┘                  └────────────────────┐
                         |                                                      │
                         |                                            ┌─────────┴──────────┐
                         |                                            │ VyOS Router (LAN)  │
                         |                                            │ Eth3: 192.168.2.1  │
                         |                                            │ Eth2: 192.168.1.1  │
                         |                                            └─────────┬──────────┘
                         |                                                      │
            Screened Subnet: 10.0.1.0/24                            Internal LAN: 192.168.1.0/24
                         |                                                      │
┌────────────────────────┴───────────────────────┐   ┌──────────────────────────┴───────────────────────┐
│                                                │   │                                                  │
│    ┌────────────────┐    ┌────────────────┐    │   │ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│    |  Win Webserver |    | RHEL Database  |    │   │ │ RHEL Client  │ │ RHEL Client  │ │ Win AD/DNS │ │
│    |   10.0.1.100   |    | 10.0.1.200     |    │   │ │ 192.168.1.100│ │ 192.168.1.101│ │ 192.168.1.5│ │
│    └────────────────┘    └────────────────┘    │   │ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                │   │                                                  │
└────────────────────────────────────────────────┘   └──────────────────────────────────────────────────┘

```

The architecture implements **defense-in-depth** through three network zones with distinct trust levels:

| Zone | Subnet | Purpose | Key Hosts |
|------|--------|---------|-----------|
| WAN | 172.31.0.0/24 | External-facing perimeter | VyOS WAN Router, Kali VM |
| Screened Subnet (DMZ) | 10.0.1.0/24 | Public-facing services | IIS Web Server, MariaDB |
| Internal LAN | 192.168.1.0/24 | Trusted workstations & core services | AD/DNS, RHEL Client, Win11 |

---

## Phase 1 — Network Infrastructure & Routing

**Objective:** Establish connectivity between all three network zones with proper routing, firewall policy, and interface configuration.

### What Was Built

- **OPNsense Firewall** — Central security appliance connecting all three zones (WAN, DMZ, LAN). Configured with zone-specific firewall rules, 1400 MTU on all interfaces to address fragmentation issues, and a static route to the LAN subnet via VyOS.
- **VyOS Router (LAN)** — Routes traffic between the internal LAN (192.168.1.0/24) and the firewall's LAN-facing interface (192.168.2.0/24). Interfaces on Eth2 (192.168.1.1) and Eth3 (192.168.2.1).
- **VyOS Router (WAN)** — Connects the environment to the external network. Eth4 receives a DHCP address from the upstream provider; Eth5 (172.31.0.2) connects to the OPNsense WAN interface.
- **NAT Configuration** — Source NAT configured on the WAN router to allow internal traffic to reach the internet.

### Challenges & Decisions

- **MTU/Fragmentation** — TLS handshake failures during package downloads traced to MTU mismatch. Resolved by setting all OPNsense interfaces to 1400 MTU.
- **Routing asymmetry** — Initial connectivity issues between LAN and DMZ required adding a permanent static route on OPNsense pointing to VyOS LAN (192.168.2.1) for the 192.168.1.0/24 subnet.

### Deliverables

| Task | Status |
|------|--------|
| Network connectivity between all zones | ✅ Complete |
| Firewall rules configured | ✅ Complete |
| Network diagram created (Task 2.2) | ✅ Complete |

---

## Phase 2 — Enterprise Services & Identity

**Objective:** Deploy the core services that a business needs to operate — directory services, a web presence, a relational database, email, and properly managed user accounts.

### 2A. Active Directory & DNS (Windows Server 2025)

Deployed a Windows Server 2025 domain controller running Active Directory Domain Services and DNS.

- **Domain:** `CTA.local` (later `Team3-Group3.local` forest)
- **Functional Level:** Windows Server 2025
- **DNS:** AD-integrated forward and reverse lookup zones
- **Organizational Units:** Admins, Standard_Users, Guests, Security_Groups

**Account Management:**

| Account Type | Examples | Privileges |
|-------------|----------|------------|
| Domain Admins | Administrator, Domain Admin | Full administrative access |
| Standard Users | Sales-rep, Support-tech, User1 | Domain Users group |
| Guest | ncyteguest | Limited access, password non-expiring, account expires 8/31/2026 |

### 2B. Domain Integration

**Windows machines** joined to the domain through standard System Properties workflow.

**Linux machines (RHEL 10)** joined using `realmd` + `sssd` + `adcli` + `krb5-workstation`:

```bash
sudo dnf install -y realmd oddjob oddjob-mkhomedir sssd adcli samba-common-tools krb5-workstation
sudo hostnamectl set-hostname rhel-client.CTA.local
sudo realm join --verbose CTA.LOCAL --user=admin
sudo authselect enable-feature with-mkhomedir
```

Domain admin sudo access on Linux machines was granted via a sudoers drop-in file:

```bash
# /etc/sudoers.d/domain-admins
%CTA\Domain\ Admins ALL=(ALL) ALL
```

### 2C. Web Server (IIS on Windows Server 2025)

Deployed IIS in the DMZ (10.0.1.100) to host the business e-commerce site.

- IIS role installed with Application Development features
- Ports 80, 443, 25, 110, 143, 587 opened for web and mail relay
- Sysprep run for unique SID generation
- Machine joined to the CTA domain

### 2D. Database Server (MariaDB on RHEL 10)

Deployed MariaDB on the RHEL Database server (10.0.1.200) to support the business data layer.

- **Database:** `academy_db`
- **Tables:** `customers`, `orders`, `products`
- **Schema design** with proper primary keys, auto-increment IDs, and foreign key relationships

**Demonstrated queries:**

- Basic `SELECT *` verification on all tables
- `JOIN` across customers and orders tables to show customer order history
- Three-table `JOIN` (customers → orders → products) for full order detail reports
- `COUNT` / `GROUP BY` aggregation to summarize orders per customer
- Revenue calculation per product line

### 2E. Email Server (MailEnable)

Deployed a MailEnable mail server on the Windows AD/DNS server with a relay server on the DMZ web server to handle mail forwarding.

- SMTP (25, 587), POP3 (110), IMAP (143) ports configured
- User email accounts provisioned for domain users
- Internal email sending and receiving tested between workstations

### 2F. Workstation Configuration

| Workstation | OS | IP | Domain | Role |
|------------|----|----|--------|------|
| Win11 Client | Windows 11 24H2 Education N | 192.168.1.100 | CTA.local | End-user workstation |
| RHEL Client | RHEL 10.1 | 192.168.1.101 | CTA.local | End-user workstation, monitoring host |

Both workstations validated for domain authentication with all user types (admin, standard, guest).

### Deliverables

| Task | Status |
|------|--------|
| 3.1 Active Directory configured | ✅ Complete |
| 3.2 Windows machines domain-joined | ✅ Complete |
| 3.3 Linux machines domain-joined | ✅ Complete |
| 3.4–3.6 Admin, user, guest accounts | ✅ Complete |
| 4.1 Web server deployed | ✅ Complete |
| 5.1–5.3 Database deployed, schema, queries | ✅ Complete |
| 6.1–6.3 Email server, accounts, internal test | ✅ Complete |
| 8.1–8.3 Workstations deployed & authenticated | ✅ Complete |

---

## Phase 3 — Monitoring, Analytics & AI Integration

**Objective:** Gain visibility into network and device health through a centralized monitoring stack, and integrate AI capabilities into the business platform.

### 3A. Prometheus + Grafana Monitoring Stack

Deployed a complete monitoring pipeline on the RHEL Client (192.168.1.101):

**Prometheus Server (v3.10.0)**
- Installed to `/opt/prometheus` to avoid SELinux context conflicts
- Configured as a `systemd` service under a dedicated `monitoring` user/group
- Scrape targets configured for node exporters across the network

**Grafana (v12.4.0)**
- Installed to `/opt/grafana`, running as a `systemd` service
- Prometheus configured as the primary data source
- Imported dashboards for Windows metrics and OPNsense telemetry
- Accessible on port 3000

**Node Exporters deployed across:**

| Host | Exporter | Port |
|------|----------|------|
| RHEL Client | `node_exporter` (Linux) | 9100 |
| RHEL Database | `node_exporter` (Linux) | 9100 |
| Win11 Client | `windows_exporter` | 9182 |
| OPNsense Firewall | Prometheus Exporter plugin | 9100 |
| VyOS Router (LAN) | `prometheus-node-exporter` | 9100 |

### 3B. Zabbix Deployment Attempt — Troubleshooting Case Study

> This section documents a real-world troubleshooting scenario that demonstrates root cause analysis methodology.

**Problem:** Zabbix 7.4 installation on the RHEL Client failed repeatedly due to TLS handshake errors (`curl error 35`) and metadata download timeouts (`curl error 28`) when accessing the official Zabbix repositories.

**Investigation:**
1. Standard HTTPS sites (google.com) worked from the same client
2. The Windows 11 client on the same subnet could download the same Zabbix files without issue
3. OPNsense logs showed no blocks — the issue originated upstream

**Root Cause:** Suspected TLS fingerprinting or deep packet inspection (DPI) at the university perimeter that treated Linux `curl`/OpenSSL 3.x traffic differently from Windows browser traffic. Later determined to be an MTU mismatch that only affected Linux machines on the network.

**Workaround Attempt:** Set up a temporary FTP server on the AD/DNS server (IIS + FTP role), downloaded packages via Windows, transferred to RHEL via FTP, and installed with `rpm -Uvh`. The repository metadata remained unreachable even after offline RPM install, so the team documented the constraint.

**MTU Mismatch Discovery:** After restarting troubleshooting from basic connectivity checks, all external sites were reachable via standard ping. A follow-up ping with the don't-fragment flag set (-M do) and a 1500-byte payload failed to reach the host, suggesting an MTU ceiling. A subsequent test at 1400 bytes succeeded, confirming the mismatch.

**Remediation:** The MTU was set to 1400 for the RHEL client interfaces as well as the other VMs on the network. Curl attempts to external hosts were then successful.

**Takeaway:** This is a common pattern in enterprise environments with restrictive network policies. The ability to identify, document, and work around upstream network constraints is a critical sysadmin skill.

### 3C. AI Infrastructure

| Task | Description | Status |
|------|-------------|--------|
| 7.1 Deploy chatbot on website | AI-powered customer service chatbot | In Progress |
| 7.2 Integrate Cyberlab GPU API | API calls to CSUSB Cyberlab GPU infrastructure | In Progress |
| 7.3 Create agentic workflow | Autonomous decision-making workflow | In Progress |
| 7.4 Document workflow logic | Technical documentation of AI pipeline | In Progress |

### Deliverables

| Task | Status |
|------|--------|
| 9.1 Network monitoring active | ✅ Complete |
| 9.2 Device monitoring active | ✅ Complete |
| 9.3 Dashboard functional | ✅ Complete |

---

## Phase 4 — Security Posture & Compliance

**Objective:** Assess the security posture of the deployed infrastructure using industry-standard frameworks and tools, identify gaps, and create a remediation plan.

### 4A. CSET Assessment (CISA Cyber Security Evaluation Tool)

Completed a self-assessment using CISA's CSET tool, evaluated against the **NIST Cybersecurity Framework (CSF) 2.0**.

**Assessment Summary:**

| Metric | Value |
|--------|-------|
| Overall Compliance | ~36% |
| Standards Compliance | ~38% |
| Security Assurance Level (SAL) | **High** |
| Confidentiality | Low |
| Integrity | High |
| Availability | Moderate |

**CSF 2.0 Function Compliance:**

| Function | Compliance | Notes |
|----------|------------|-------|
| **Identify** | ~98% | Asset inventory and risk context well-documented |
| **Govern** | ~42% | Policies and risk management partially addressed |
| **Protect** | ~40% | Access control and configuration management in place |
| **Detect** | ~0% | Monitoring deployed but formal detection processes not established |
| **Respond** | ~0% | No formal incident response plan documented |
| **Recover** | ~0% | Backup configured but recovery procedures not formalized |

### 4B. Ranked Areas of Concern

The CSET report identified **57 unmet requirements** at the High SAL level. Top risk categories by weighted score:

1. **Detect** — No formal adverse event detection procedures beyond basic monitoring
2. **Protect** — Identity management and access control policies need formalization
3. **Respond** — No incident response plan, escalation procedures, or forensic capability
4. **Recover** — Backup exists but no tested recovery plan or post-incident procedures
5. **Govern** — Risk management objectives and cybersecurity policies not formally established

### 4C. Remediation Roadmap

**Immediate priorities (High impact, lower effort):**

- Formalize an incident response plan covering detection, containment, eradication, and recovery
- Establish log review procedures and alerting thresholds in Grafana
- Document access control policies and enforce least-privilege principles
- Test database recovery procedures and document the process

**Medium-term improvements:**

- Implement network-based intrusion detection (Suricata or Snort on OPNsense)
- Establish a formal change management process
- Create and test backup verification procedures
- Develop a cybersecurity risk register

**Long-term goals:**

- Build a security operations playbook
- Conduct tabletop exercises for incident response
- Implement SIEM capabilities for log correlation

### 4D. Vulnerability Scanning

| Task | Status |
|------|--------|
| 12.1 Vulnerability scan completed | ✅ Complete |
| 12.2 CSET assessment completed | ✅ Complete |
| 12.3 Remediation documented | ✅ Complete |

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Virtualization** | Proxmox VE (CSUSB Cyberlab) |
| **Firewall** | OPNsense 26.1.2 |
| **Routing** | VyOS 1.5 LTS |
| **Directory Services** | Windows Server 2025 — Active Directory, DNS |
| **Web Server** | IIS on Windows Server 2025 |
| **Database** | MariaDB on RHEL 10.1 |
| **Email** | MailEnable (AD/DNS server + DMZ relay) |
| **Monitoring** | Prometheus 3.10.0, Grafana 12.4.0, node_exporter, windows_exporter |
| **Workstations** | Windows 11 24H2, RHEL 10.1 |
| **Security Testing** | Kali Linux 2026.1, CISA CSET |
| **Compliance Framework** | NIST CSF 2.0 |

---

## Lessons Learned

**1. MTU matters more than you think.** TLS handshake failures that appeared to be certificate or firewall issues were actually caused by packet fragmentation from mismatched MTU sizes across zones. Setting all interfaces to 1400 MTU resolved intermittent connectivity problems that had been consuming hours of troubleshooting time.

**2. SELinux is not optional.** Moving Prometheus and Grafana binaries to `/opt/` instead of user home directories eliminated SELinux denials. Working *with* SELinux (choosing appropriate filesystem paths) is faster than working *around* it (writing custom policies or disabling enforcement).

**3. Documentation is a deliverable, not an afterthought.** Maintaining a living configuration document throughout the project prevented the scramble of trying to reconstruct decisions and credentials at the end. The config tables and credential sheets were referenced daily.

**4. The CSET gap is the roadmap.** Scoring 36% overall against CSF 2.0 was initially discouraging, but it directly produced the prioritized remediation plan. The framework's Detect/Respond/Recover gaps mapped precisely to the work remaining — proving the tool's value for security planning.

---

## Repository Structure

```
.
├── README.md
│
├── docs/
│   ├── network-diagram.pdf
│   ├── enterprise-requirements.pdf
│   ├── task-assignment.pdf
│   ├── cset-report.pdf
│   ├── kanban-progress.pdf
│   └── cyberlab-guidelines.pdf
│
├── vms/
│   ├── opnsense-firewall/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── interface-config.png
│   │   │   ├── firewall-rules.png
│   │   │   ├── static-route.png
│   │   │   ├── gateway-config.png
│   │   │   └── prometheus-exporter.png
│   │   └── configs/
│   │       └── firewall-rules.txt
│   │
│   ├── vyos-router-lan/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   └── configs/
│   │       ├── interfaces.conf
│   │       └── routes.conf
│   │
│   ├── vyos-router-wan/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   └── configs/
│   │       ├── interfaces.conf
│   │       ├── routes.conf
│   │       └── nat.conf
│   │
│   ├── windows-ad-dns/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── roles-features-wizard.png
│   │   │   ├── ad-promote.png
│   │   │   ├── new-forest.png
│   │   │   ├── ou-config.png
│   │   │   ├── ftp-site-config.png
│   │   │   ├── ftp-firewall-rule.png
│   │   │   └── mailenable-setup.png
│   │   └── configs/
│   │       ├── domain-setup.md
│   │       ├── ou-and-groups.md
│   │       ├── ftp-server-setup.md
│   │       └── mail-server-setup.md
│   │
│   ├── windows-11-client/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── domain-join.png
│   │   │   ├── icmp-outbound-rule.png
│   │   │   ├── windows-exporter-service.png
│   │   │   └── grafana-dashboard.png
│   │   └── configs/
│   │       ├── domain-join.md
│   │       └── firewall-rules.md
│   │
│   ├── rhel-client/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── realm-join.png
│   │   │   ├── chrony-sources.png
│   │   │   ├── prometheus-targets.png
│   │   │   ├── grafana-datasource.png
│   │   │   ├── grafana-opnsense-dashboard.png
│   │   │   ├── grafana-windows-dashboard.png
│   │   │   └── zabbix-error-log.png
│   │   └── configs/
│   │       ├── systemd/
│   │       │   ├── prometheus.service
│   │       │   ├── grafana.service
│   │       │   └── node_exporter.service
│   │       ├── prometheus/
│   │       │   └── prometheus.yml
│   │       ├── grafana/
│   │       │   └── custom.ini
│   │       ├── domain-join.sh
│   │       └── chrony.conf
│   │
│   ├── rhel-database/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── realm-join.png
│   │   │   ├── mariadb-status.png
│   │   │   ├── show-tables.png
│   │   │   ├── customers-table.png
│   │   │   ├── orders-table.png
│   │   │   ├── products-table.png
│   │   │   ├── join-query.png
│   │   │   ├── revenue-query.png
│   │   │   └── executive-summary-query.png
│   │   └── configs/
│   │       ├── systemd/
│   │       │   └── node_exporter.service
│   │       ├── database/
│   │       │   └── academy_schema.sql
│   │       └── domain-join.sh
│   │
│   ├── windows-webserver/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── sysprep.png
│   │   │   ├── domain-join.png
│   │   │   ├── iis-roles.png
│   │   │   └── webmail-ports.png
│   │   └── configs/
│   │       ├── iis-setup.md
│   │       ├── web.config
│   │       └── mail-relay-setup.md
│   │
│   └── kali-linux/
│       ├── CONFIGURATION.md
│       └── screenshots/
│
└── scripts/
    └── monitoring-setup.sh
```

> **Note:** Credentials referenced in project documentation have been redacted from this public repository. The original secured credential sheet is maintained separately.

---

## About the VCCC

The [Virtual Cybersecurity Career Challenge](https://www.ncyte.net/career-seekers/career-seeker-resources/virtual-cybersecurity-career-challenge) is a 12-week program run by the **National Cybersecurity Training & Education Center (NCyTE)** at Whatcom Community College, funded by the **National Science Foundation (NSF)**. Teams of five students configure, operate, protect, and defend a small enterprise network built on virtual machines hosted in a cloud-based Proxmox environment.

The challenge covers the full spectrum of enterprise IT: project management, network architecture, system administration, database management, web services, email, monitoring, AI integration, and security compliance. It culminates with a team presentation to cybersecurity industry professionals.

Participants typically invest **160+ hours** and may use the experience as a capstone project or for co-op credit. Upon completion, students receive a certificate demonstrating applied cybersecurity skills to prospective employers.

---

**Team R3** — Logan · Joseph · Ahmed · Vitaly

*Built during the 2026 NCyTE Virtual Cybersecurity Career Challenge (February – April 2026)*
*Hosted on CSUSB Cyberlab Proxmox Infrastructure*


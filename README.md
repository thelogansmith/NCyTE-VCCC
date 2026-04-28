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

The infrastructure spans **nine virtual machines** across three trust zones, running a mix of Windows Server 2025, Red Hat Enterprise Linux 10, VyOS, OPNsense, and Kali Linux. Over the course of the challenge, we configured centralized authentication, deployed web and database servers, set up email, built a monitoring stack, integrated an AI chatbot, and assessed our security posture against the NIST Cybersecurity Framework (CSF 2.0).

**Key accomplishments:**

- Designed and implemented a three-zone defense-in-depth network architecture
- Deployed Active Directory with domain-joined Windows and Linux workstations
- Built a MariaDB-backed relational database with multi-table joins and business queries
- Configured Prometheus + Grafana monitoring across all network zones
- Deployed Wazuh for vulnerability detection and log monitoring
- Integrated an AI chatbot (ARIA) backed by the CSUSB Cyberlab GPU API
- Configured automated MariaDB backups with verified restore testing
- Deployed a MailEnable-based internal email system with relay architecture
- Completed Preliminary and Final CSET self-assessments against CSF 2.0 — moving from **40% to 72% overall compliance** in roughly two months

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

> 📸 **SCREENSHOT:** Final network diagram (`docs/network-diagram.pdf` rendered as PNG)

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

> 📸 **SCREENSHOT:** OPNsense interface configuration showing WAN/DMZ/LAN assignments
> 📸 **SCREENSHOT:** OPNsense firewall rules (per-zone)
> 📸 **SCREENSHOT:** OPNsense static route for 192.168.1.0/24 → 192.168.2.1
> 📸 **SCREENSHOT:** VyOS WAN router `show interfaces` and `show nat source rules`
> 📸 **SCREENSHOT:** VyOS LAN router `show interfaces` and routing table

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

- **Domain:** `CTA.local`
- **Functional Level:** Windows Server 2025
- **DNS:** AD-integrated forward and reverse lookup zones
- **Organizational Units:** Admins, Standard_Users, Guests, Security_Groups

**Account Management:**

| Account Type | Examples | Privileges |
|-------------|----------|------------|
| Domain Admins | Administrator, Domain Admin | Full administrative access |
| Standard Users | Sales-rep, Support-tech, User1 | Domain Users group |
| Guest | ncyteguest | Limited access, password non-expiring, account expires 8/31/2026 |

> 📸 **SCREENSHOT:** Server Manager — AD DS and DNS roles installed
> 📸 **SCREENSHOT:** "Promote this server to a domain controller" wizard
> 📸 **SCREENSHOT:** New forest creation (CTA.local)
> 📸 **SCREENSHOT:** Active Directory Users and Computers — OU layout
> 📸 **SCREENSHOT:** Sample standard user and guest account property pages

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

> 📸 **SCREENSHOT:** `realm list` output on RHEL Client showing CTA.LOCAL membership
> 📸 **SCREENSHOT:** Domain login on Win11 Client (lock screen showing CTA\username)
> 📸 **SCREENSHOT:** Domain login on RHEL Client with home directory auto-creation

### 2C. Web Server (IIS on Windows Server 2025)

Deployed IIS in the DMZ (10.0.1.100) to host the business e-commerce site.

- IIS role installed with Application Development features
- Ports 80, 443, 25, 110, 143, 587 opened for web and mail relay
- Sysprep run for unique SID generation
- Machine joined to the CTA domain
- E-commerce site lists three goods (Flipper Zero, Raspberry Pi 5, Wi-Fi Pineapple) and three services (Courses, Certifications, Mentoring) with shopping cart functionality
- **Help desk page (Task 4.5)** deployed alongside the storefront for customer support ticket submission

> 📸 **SCREENSHOT:** IIS Manager showing the CTA site bindings
> 📸 **SCREENSHOT:** Sysprep completion dialog
> 📸 **SCREENSHOT:** CTA storefront homepage in browser
> 📸 **SCREENSHOT:** Shopping cart with item added → checkout flow
> 📸 **SCREENSHOT:** Help desk page with ticket submission form

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

> 📸 **SCREENSHOT:** `systemctl status mariadb` showing active/running
> 📸 **SCREENSHOT:** `SHOW TABLES;` output for academy_db
> 📸 **SCREENSHOT:** Customers, orders, and products table sample data
> 📸 **SCREENSHOT:** Three-table JOIN query result
> 📸 **SCREENSHOT:** Revenue-per-product aggregation query result

### 2E. Email Server (MailEnable)

Deployed a MailEnable mail server on the Windows AD/DNS server with a relay server on the DMZ web server to handle mail forwarding.

- SMTP (25, 587), POP3 (110), IMAP (143) ports configured
- User email accounts provisioned for domain users
- Internal email sending and receiving verified between Win11 and RHEL workstations

> 📸 **SCREENSHOT:** MailEnable admin console — server overview
> 📸 **SCREENSHOT:** MailEnable user account list
> 📸 **SCREENSHOT:** Test email sent from Win11 client → received on RHEL client
> 📸 **SCREENSHOT:** DMZ web server firewall rules showing mail relay ports

### 2F. Workstation Configuration

| Workstation | OS | IP | Domain | Role |
|------------|----|----|--------|------|
| Win11 Client | Windows 11 24H2 Education N | 192.168.1.100 | CTA.local | End-user workstation |
| RHEL Client | RHEL 10.1 | 192.168.1.101 | CTA.local | End-user workstation, monitoring host |

Both workstations validated for domain authentication with all user types (admin, standard, guest), and verified end-to-end access to web, email, and database services.

> 📸 **SCREENSHOT:** Win11 Client domain join confirmation (System Properties)
> 📸 **SCREENSHOT:** Win11 client running business apps (Office, browser, mail client)
> 📸 **SCREENSHOT:** RHEL client GNOME desktop showing GDM domain login

### Deliverables

| Task | Status |
|------|--------|
| 3.1 Active Directory configured | ✅ Complete |
| 3.2 Windows machines domain-joined | ✅ Complete |
| 3.3 Linux machines domain-joined | ✅ Complete |
| 3.4–3.6 Admin, user, guest accounts | ✅ Complete |
| 4.1 Web server deployed | ✅ Complete |
| 4.2 Shopping cart functional | ✅ Complete |
| 4.3–4.4 Goods and services on website | ✅ Complete |
| 4.5 Help desk web page | ✅ Complete |
| 5.1–5.3 Database deployed, schema, queries | ✅ Complete |
| 6.1–6.3 Email server, accounts, internal test | ✅ Complete |
| 8.1–8.6 Workstations deployed, authenticated, applications installed | ✅ Complete |

---

## Phase 3 — Monitoring, Analytics & AI Integration

**Objective:** Gain visibility into network and device health through a centralized monitoring stack, integrate AI capabilities into the business platform, and protect business data with automated backups.

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

> 📸 **SCREENSHOT:** `systemctl status prometheus grafana-server node_exporter` on RHEL Client
> 📸 **SCREENSHOT:** Prometheus targets page — all UP
> 📸 **SCREENSHOT:** Grafana data source configuration
> 📸 **SCREENSHOT:** OPNsense dashboard in Grafana
> 📸 **SCREENSHOT:** Windows exporter dashboard in Grafana

### 3B. Wazuh — Vulnerability Detection & Log Monitoring

Deployed Wazuh to provide host-based intrusion detection, vulnerability scanning, and centralized log monitoring across the environment. Wazuh agents were installed on all Windows and Linux hosts and report to the Wazuh manager, which integrates with the broader monitoring view in Grafana.

- **Wazuh Manager** — central server collecting agent telemetry
- **Wazuh Agents** — deployed on RHEL Client, RHEL Database, Windows AD/DNS, Win11 Client, and Windows Webserver
- **Vulnerability detection module** — enabled, providing CVE-level findings on installed packages
- **Log monitoring** — Windows Event Log, Linux audit/syslog, and IIS logs forwarded to the manager

This deployment satisfies Task 12.1 (vulnerability scan) and supports the Detect-category controls in CSF 2.0.

> 📸 **SCREENSHOT:** Wazuh dashboard — agent status (all active)
> 📸 **SCREENSHOT:** Wazuh vulnerability detector findings page
> 📸 **SCREENSHOT:** Wazuh security alerts feed
> 📸 **SCREENSHOT:** Sample CVE detail page from a scanned host

### 3C. Zabbix Deployment Attempt — Troubleshooting Case Study

> This section documents a real-world troubleshooting scenario that demonstrates root cause analysis methodology. Zabbix was ultimately set aside in favor of the Prometheus + Grafana + Wazuh stack, but the investigation produced the MTU finding that improved connectivity for the entire environment.

**Problem:** Zabbix 7.4 installation on the RHEL Client failed repeatedly due to TLS handshake errors (`curl error 35`) and metadata download timeouts (`curl error 28`) when accessing the official Zabbix repositories.

**Investigation:**
1. Standard HTTPS sites (google.com) worked from the same client
2. The Windows 11 client on the same subnet could download the same Zabbix files without issue
3. OPNsense logs showed no blocks — the issue originated upstream

**Initial Suspicion:** TLS fingerprinting or deep packet inspection (DPI) at the university perimeter that treated Linux `curl`/OpenSSL 3.x traffic differently from Windows browser traffic.

**Workaround Attempt:** Set up a temporary FTP server on the AD/DNS server (IIS + FTP role), downloaded packages via Windows, transferred to RHEL via FTP, and installed with `rpm -Uvh`. The repository metadata remained unreachable even after offline RPM install, so the team continued investigating.

**Root Cause Discovery:** After restarting troubleshooting from basic connectivity checks, all external sites were reachable via standard ping. A follow-up ping with the don't-fragment flag set (`-M do`) and a 1500-byte payload failed to reach the host, suggesting an MTU ceiling. A subsequent test at 1400 bytes succeeded, confirming an MTU mismatch on the path that affected larger TLS handshakes.

**Remediation:** The MTU was set to 1400 for the RHEL client interfaces as well as the other VMs on the network. Curl attempts to external hosts were then successful — and the same fix resolved intermittent TLS issues encountered during the Prometheus install.

**Takeaway:** This is a common pattern in enterprise environments with restrictive network policies. The ability to identify, document, and work around upstream network constraints is a critical sysadmin skill.

> 📸 **SCREENSHOT:** Zabbix `curl error 35` log output
> 📸 **SCREENSHOT:** `ping -M do -s 1472` failing → `-s 1372` succeeding (MTU evidence)

### 3D. AI Infrastructure — ARIA Chatbot

Deployed **ARIA** (Automated Response & Intelligence Assistant), an AI-powered customer support chatbot, on the CTA storefront. ARIA answers questions about courses, certifications, and security tools sold by the academy.

**Architecture:**

```
Browser (chatbot.js widget)
        │
        │  POST /proxy.aspx  (same-origin, no API key in browser)
        ▼
IIS Webserver (10.0.1.100)
   └─ proxy.aspx  (C# handler)
        │
        │  HTTPS + Bearer token (key from web.config)
        ▼
CSUSB Cyberlab GPU API
   └─ /chat/completions  (OpenAI-compatible endpoint)
```

**Key design decisions:**

- **API key stays server-side.** The model API key lives only in `web.config` `<appSettings>` on the IIS server. The browser-side widget never sees it — it only knows to POST to `/proxy.aspx` on the same origin. This satisfies basic credential hygiene requirements.
- **Direct browser access to the proxy is blocked.** A URL Rewrite rule in `web.config` returns 404 for any `GET` to `/proxy.aspx`, ensuring it's only callable as the JSON POST endpoint the widget uses.
- **Rolling conversation history.** The widget maintains the last 10 message pairs as context to keep the chatbot coherent across a conversation while bounding token usage.
- **System prompt scoping.** ARIA is instructed to stay on-topic for CTA's products and services, redirect off-topic questions, and never invent pricing or dates.

**Agentic workflow (Task 7.3):** The chatbot acts as a triage agent — when a user describes a problem outside its knowledge (e.g., a hardware return), it routes them to the help desk page rather than fabricating an answer, demonstrating autonomous decision-making between answering directly and escalating.

> 📸 **SCREENSHOT:** ARIA chat widget open on the CTA storefront
> 📸 **SCREENSHOT:** Sample conversation — user asks about Flipper Zero, ARIA answers
> 📸 **SCREENSHOT:** Sample conversation — off-topic question redirected
> 📸 **SCREENSHOT:** `web.config` `<appSettings>` section (API key redacted)
> 📸 **SCREENSHOT:** IIS proxy.aspx 404 response to direct browser GET
> 📸 **SCREENSHOT:** Cyberlab API response in browser dev tools (Network tab)

### 3E. Backup & Recovery

Configured automated backups for the MariaDB database and verified the restore procedure end-to-end.

- **Backup script:** `mysqldump` of `academy_db` to a timestamped archive on the RHEL Database server
- **Schedule:** nightly `cron` job under a dedicated backup user
- **Retention:** rolling 7-day window of full dumps
- **Restore test:** dropped a non-production copy of `academy_db`, restored from the most recent dump, and verified row counts and a sample three-table JOIN matched pre-drop output

> 📸 **SCREENSHOT:** `crontab -l` showing the nightly backup job
> 📸 **SCREENSHOT:** Directory listing of `/var/backups/mariadb/` with timestamped dumps
> 📸 **SCREENSHOT:** Restore session — `mysql academy_db < dump.sql` followed by row-count verification query

### Deliverables

| Task | Status |
|------|--------|
| 7.1 Chatbot deployed on website | ✅ Complete |
| 7.2 Cyberlab GPU API integrated | ✅ Complete |
| 7.3 Agentic workflow operational | ✅ Complete |
| 7.4 Workflow logic documented | ✅ Complete |
| 9.1 Network monitoring active | ✅ Complete |
| 9.2 Device monitoring active | ✅ Complete |
| 9.3 Dashboard functional | ✅ Complete |
| 10.1 Database backups configured | ✅ Complete |
| 10.2 Database restore tested | ✅ Complete |

---

## Phase 4 — Security Posture & Compliance

**Objective:** Assess the security posture of the deployed infrastructure using industry-standard frameworks and tools, identify gaps, and create a remediation plan.

### 4A. CSET Assessment (CISA Cyber Security Evaluation Tool)

Completed two self-assessments using CISA's CSET tool against the **NIST Cybersecurity Framework (CSF) 2.0** — a Preliminary baseline on **2/12/2026** and a Final assessment on **4/17/2026**.

**Headline Results:**

| Metric | Preliminary (2/12) | Final (4/17) | Change |
|---|---|---|---|
| Overall Compliance | 40% | **72%** | +32 pts |
| Yes responses | 36% | 61% | +25 pts |
| No responses | 54% | 25% | −29 pts |
| Security Assurance Level | High | High | — |

**CSF 2.0 Function Compliance:**

| Function | Preliminary | Final | Notes |
|----------|------------|-------|-------|
| **Govern** | ~42% | ~80% | Roles, responsibilities, and policies formalized |
| **Identify** | ~98% | ~74% | Final added five additional controls evaluated at the ranked level — a more rigorous review, not lost capability |
| **Protect** | ~40% | ~66% | AD-based identity (PR.AA-01–05), OPNsense segmentation (PR.IR-01), config management (PR.PS-01) |
| **Detect** | 0% | **100%** | Prometheus + Grafana + Wazuh closed all 11 Detect controls |
| **Respond** | 0% | ~38% | Partial — IR plan still outstanding |
| **Recover** | 0% | ~71% | Backup + restore testing closed the bulk of Recover gaps |

> 📸 **SCREENSHOT:** Preliminary CSET dashboard (40% overall, Detect/Respond/Recover at 0%)
> 📸 **SCREENSHOT:** Final CSET dashboard (72% overall, Detect at 100%)
> 📸 **SCREENSHOT:** CSF 2.0 function-by-function comparison chart
> 📸 **SCREENSHOT:** CSET ranked questions page from the Final report

### 4B. What Drove the Improvement

- **Detect (0% → 100%)** — The Netdata/Wazuh stack alone closed 11 Detect-category gaps. `node_exporter` deployment across RHEL Database, RHEL Client, Win11 Client, VyOS LAN, and OPNsense; Wazuh agents on all hosts for vulnerability and log telemetry.
- **Protect — Identity & Access (PR.AA-01 through PR.AA-05)** — Active Directory deployment, realm-joined RHEL hosts, and the `%CTA\Domain Admins` sudoers drop-in (least privilege).
- **Protect — Network Segmentation (PR.IR-01) and Configuration Management (PR.PS-01)** — OPNsense WAN/DMZ/LAN zoning plus the comprehensive live documentation (Live Config Table, Credentials sheet, Software & License Inventory, Service Configurations, Change Log).
- **Recover (0% → ~71%)** — Automated MariaDB backups and verified restore testing closed RC.RP-01, RC.RP-03, RC.RP-05, and RC.RP-06.
- **Govern** — Documented role assignments (GV.RR-02), risk management objectives (GV.RM-01–07), and cybersecurity policy (GV.PO-01).

### 4C. Remaining Gaps & Remediation Roadmap

The Final assessment identified **14 remaining unmet requirements at the High SAL level**, concentrated in **Respond** (incident management):

**Highest priority — Incident Response (Respond function):**
- RS.MA-01 through RS.MA-05 — incident response plan execution, triage, categorization, escalation, and recovery initiation
- RS.MI-01, RS.MI-02 — incident containment and eradication
- RS.AN-08 — incident magnitude estimation

**Data Protection (Protect):**
- PR.DS-01/02/10 — data-at-rest, in-transit, and in-use protection (TLS for MariaDB, HTTPS-only for IIS, disk-level encryption)
- PR.AA-04 — enforce LDAPS over plain LDAP
- PR.AA-06 — physical access control documentation
- PR.IR-04 — resource capacity for availability

**Governance & Supply Chain:**
- GV.SC-08, -09, -10 — supplier inclusion in IR, supply-chain risk management, post-relationship provisions
- GV.RR-03 — resource allocation
- GV.PO-02 — policy review cadence

**Identify (asset & risk management):**
- ID.AM-05, ID.AM-07, ID.RA-06, ID.RA-10, ID.IM-04 — asset prioritization, data inventory, risk-response tracking, supplier assessment, IR plan maintenance

**Recover:**
- RC.RP-02 — recovery action scoping
- RC.RP-04 — post-incident operational norms

**Recommended next sprint:**

1. Build out an incident response plan covering detection, containment, eradication, and recovery — closes the seven-control Respond cluster
2. Implement data protection (TLS for MariaDB on 3306, redirect HTTP→HTTPS on IIS, enforce LDAPS, document at-rest encryption)
3. Establish formal change management and policy review cadence to close governance gaps

### 4D. Vulnerability Scanning

Wazuh's vulnerability detector module provided continuous CVE-level scanning across all monitored hosts (Task 12.1). Findings were reviewed during the Final CSET assessment and incorporated into the remediation roadmap above (Task 12.3).

> 📸 **SCREENSHOT:** Wazuh vulnerability detector summary by host
> 📸 **SCREENSHOT:** CVE remediation tracking spreadsheet

### Deliverables

| Task | Status |
|------|--------|
| 2.3 Preliminary CSET assessment | ✅ Complete |
| 12.1 Vulnerability scan completed (Wazuh) | ✅ Complete |
| 12.2 Final CSET assessment completed | ✅ Complete |
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
| **Security Monitoring** | Wazuh (manager + agents) |
| **AI / Chatbot** | ARIA widget (vanilla JS) → IIS proxy.aspx → CSUSB Cyberlab GPU API |
| **Workstations** | Windows 11 24H2, RHEL 10.1 |
| **Security Testing** | Kali Linux 2026.1, CISA CSET |
| **Compliance Framework** | NIST CSF 2.0 |

---

## Lessons Learned

**1. MTU matters more than you think.** TLS handshake failures that appeared to be certificate or firewall issues were actually caused by packet fragmentation from mismatched MTU sizes across zones. Setting all interfaces to 1400 MTU resolved intermittent connectivity problems that had been consuming hours of troubleshooting time — and cleared the way for both Zabbix and the Prometheus install.

**2. SELinux is not optional.** Moving Prometheus and Grafana binaries to `/opt/` instead of user home directories eliminated SELinux denials. Working *with* SELinux (choosing appropriate filesystem paths) is faster than working *around* it (writing custom policies or disabling enforcement).

**3. Documentation is a deliverable, not an afterthought.** Maintaining a living configuration document throughout the project prevented the scramble of trying to reconstruct decisions and credentials at the end. The config tables and credential sheets were referenced daily, and they directly fed the Govern and Protect controls in the Final CSET review.

**4. Keep secrets server-side.** The ARIA chatbot's API key never touches the browser — it lives in `web.config` on the IIS server, and the browser-side widget POSTs to a same-origin proxy. This is a small architectural decision with a large security payoff: no key in the page source, no key in network traces, no key in client-side storage.

**5. The CSET gap is the roadmap.** Moving from 40% to 72% overall compliance in two months is meaningful, but the more useful output of the Final assessment is the prioritized list of what's still open. Respond (incident response) is the obvious next sprint — and the framework told us so without us having to guess.

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
│   ├── cset-preliminary-report.pdf
│   ├── cset-final-report.pdf
│   ├── cset-gap-analysis-summary.md
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
│   │   │   ├── wazuh-agents.png
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
│   │   │   ├── executive-summary-query.png
│   │   │   ├── backup-cron.png
│   │   │   └── restore-test.png
│   │   └── configs/
│   │       ├── systemd/
│   │       │   └── node_exporter.service
│   │       ├── database/
│   │       │   ├── academy_schema.sql
│   │       │   └── backup.sh
│   │       └── domain-join.sh
│   │
│   ├── windows-webserver/
│   │   ├── CONFIGURATION.md
│   │   ├── screenshots/
│   │   │   ├── sysprep.png
│   │   │   ├── domain-join.png
│   │   │   ├── iis-roles.png
│   │   │   ├── webmail-ports.png
│   │   │   ├── storefront-home.png
│   │   │   ├── shopping-cart.png
│   │   │   ├── helpdesk-page.png
│   │   │   └── aria-chatbot.png
│   │   └── configs/
│   │       ├── iis-setup.md
│   │       ├── web.config
│   │       ├── proxy.aspx
│   │       ├── chatbot.js
│   │       └── mail-relay-setup.md
│   │
│   └── kali-linux/
│       ├── CONFIGURATION.md
│       └── screenshots/
│
└── scripts/
    ├── monitoring-setup.sh
    └── mariadb-backup.sh
```

> **Note:** Credentials referenced in project documentation have been redacted from this public repository. The original secured credential sheet is maintained separately. The Cyberlab API key in `web.config` has been replaced with a placeholder.

---

## About the VCCC

The [Virtual Cybersecurity Career Challenge](https://www.ncyte.net/career-seekers/career-seeker-resources/virtual-cybersecurity-career-challenge) is a 12-week program run by the **National Cybersecurity Training & Education Center (NCyTE)** at Whatcom Community College, funded by the **National Science Foundation (NSF)**. Teams of five students configure, operate, protect, and defend a small enterprise network built on virtual machines hosted in a cloud-based Proxmox environment.

The challenge covers the full spectrum of enterprise IT: project management, network architecture, system administration, database management, web services, email, monitoring, AI integration, and security compliance. It culminates with a team presentation to cybersecurity industry professionals.

Participants typically invest **160+ hours** and may use the experience as a capstone project or for co-op credit. Upon completion, students receive a certificate demonstrating applied cybersecurity skills to prospective employers.

---

**Team R3** — Logan · Joseph · Ahmed · Vitaly

*Built during the 2026 NCyTE Virtual Cybersecurity Career Challenge (February – April 2026)*
*Hosted on CSUSB Cyberlab Proxmox Infrastructure*

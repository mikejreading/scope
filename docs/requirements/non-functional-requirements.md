# Non-Functional Requirements (NFRs) - Enterprise School Management Platform (Revised)

This document outlines the Non-Functional Requirements (NFRs) for the Enterprise School Management Platform. These requirements define the quality attributes of the system and specify criteria that can be used to judge the operation of the system, rather than specific behaviours. Adherence to these NFRs is critical for the platform's success, particularly given its enterprise-grade nature, multi-tenancy, and handling of sensitive data.

## 1. Performance

Performance requirements dictate how quickly the system responds to user input and performs operations.

- **1.1. Response Times:**

  - **1.1.1. User Interface (UI) Responsiveness:**
    - All primary user interface loads (e.g., dashboard, timetable view, pupil profile) shall load and become interactive within **1-2 seconds** for 95% of users under typical load conditions (i.e., browser rendering of initial data, excluding initial page load which may include asset loading). This tighter target ensures a snappy and immediate user experience, crucial for an application used frequently throughout the school day.
    - Interactive elements (e.g., dropdowns, buttons, form field interactions) shall respond within **500 milliseconds** for 99% of user interactions, providing instant feedback and a fluid interface.
  - **1.1.2. API Response Times:**
    - Read-heavy API calls (e.g., fetching a pupil's attendance, viewing a timetable, retrieving announcements) shall respond within **500 milliseconds** for 95% of requests.
    - Write-heavy API calls (e.g., submitting attendance, saving a grade, updating a pupil record) shall complete and respond within **1.5 seconds** for 95% of requests.
    - Complex or batch operations (e.g., timetable generation, bulk data imports/exports, large report generation) may have longer response times but should not exceed **10 seconds** for real-time operations, and longer background processes (e.g., full system reports) shall notify users upon completion via asynchronous means.
  - **1.1.3. Search Functionality:**
    - Search queries (e.g., pupil search, staff search, library book search) shall return relevant results within **500 milliseconds** for 90% of queries. This rapid response is vital for quick lookups and efficient daily operations.

- **1.2. Throughput:**

  - The system shall support a minimum of **5,000 concurrent active users** (logged in and performing actions) without significant degradation in response times.
  - The platform shall be capable of processing **10,000 API requests per minute** during peak hours for a single large school tenant, or proportionally across multiple smaller tenants.
  - Attendance submission for a class of 30 pupils shall be processed within **2 seconds**.

- **1.3. Scalability:**
  - **1.3.1. Horizontal Scalability:** The architecture shall support horizontal scaling of application, database, and caching layers to accommodate growth in the number of schools, pupils, and concurrent users without requiring significant re-architecture or code changes.
  - **1.3.2. Vertical Scalability:** Where applicable, individual components shall be able to scale vertically (e.g., increasing CPU/RAM for database instances) to meet increased demand.
  - **1.3.3. Tenant Growth:** The platform shall efficiently manage a projected growth of **200 new schools per year** for the first three years, each with an average of 500 pupils and 50 staff members.
  - **1.3.4. Data Volume:** The system shall maintain performance as the volume of historical data (e.g., academic records, attendance logs, audit trails) grows into terabytes over a 5-year period.

## 2. Availability

Availability requirements specify the proportion of time the system is operational and accessible.

- **2.1. Uptime SLA:**
  - The platform shall target a **99.9% uptime** for core functionalities (excluding scheduled maintenance windows) as measured over a monthly period. This translates to no more than approximately 43 minutes of unplanned downtime per month.
  - Scheduled maintenance windows shall be communicated to School Admins and Platform Admins with at least **48 hours advance notice** and ideally occur outside of peak school operational hours (e.g., 10 PM - 6 AM GMT on weekends).
- **2.2. Disaster Recovery (DR):**
  - **2.2.1. Recovery Point Objective (RPO):** In the event of a catastrophic data loss incident, the maximum acceptable data loss shall be **1 hour**. This means data backups should occur at least hourly.
  - **2.2.2. Recovery Time Objective (RTO):** In the event of a critical system failure, the platform shall be fully operational and accessible within **4 hours**.
- **2.3. Failover:** Critical components (e.g., databases, API servers) shall be deployed with redundancy and automatic failover capabilities to minimise downtime in case of component failure.

## 3. Security

Security NFRs complement the functional security requirements and ensure the system's resilience against threats.

- **3.1. Data Encryption:**
  - All data in transit (client-server, inter-service) shall be encrypted using TLS 1.2 or higher.
  - All sensitive data at rest (database, backups, file storage) shall be encrypted using AES-256 or equivalent standards.
- **3.2. Authentication Strength:**
  - Password hashing shall use modern, computationally intensive algorithms (e.g., bcrypt, Argon2).
  - MFA implementation shall adhere to industry best practices (e.g., TOTP via authenticator apps).
- **3.3. Vulnerability Management:**
  - The application shall undergo regular security vulnerability scanning (automated and manual penetration testing) at least **quarterly**.
  - All identified critical and high-severity vulnerabilities shall be remediated within **7 days** of discovery.
- **3.4. Session Management:**
  - User sessions shall automatically expire after **30 minutes of inactivity** for standard users, and **15 minutes** for administrative roles (School Admin, Platform Admin).
  - Session tokens shall be HTTP-only, secure cookies.
- **3.5. Auditability & Logging:**
  - All security-relevant events (e.g., login attempts, access failures, data modifications, impersonation) shall be logged and retained as per Section 3.5 of the functional requirements. Logs shall be immutable and accessible for audit.
- **3.6. Tenant Isolation:**
  - Automated tests shall run daily to validate logical tenant data isolation, ensuring no cross-tenant data leakage occurs.

# Jali Data Governance Strategy

## Overview
We utilize **Apache Atlas** for metadata management, lineage tracking, and establishing a security perimeter around sensitive OVC (Orphans and Vulnerable Children) data.

## 1. Classification (Tags)
We define the following security classifications to be propagated through the system:

| Tag | Description | Applicable Columns | Security Policy |
| :--- | :--- | :--- | :--- |
| **PII** | Personally Identifiable Information | `ovc_names`, `caregiver_names`, `phone`, `national_id` | Masked for non-admin users. Access audit required. |
| **SENSITIVE_HEALTH** | Medical/Health Data | `hiv_status`, `viral_load`, `art_status` | **Strictly Restricted**. Only active CHVs linked to the specific OVC access this. |
| **LOCATION_DATA** | Geographic Info | `ward_id`, `household` | Aggregate-only for reporting users. |

## 2. Access Control (Ranger Integration)
Apache Atlas works with **Apache Ranger** to enforce policies based on these tags.
- **Policy 1**: If User has role `VIEWER` and Tag is `SENSITIVE_HEALTH` -> **DENY**.
- **Policy 2**: If User has role `CHV` -> ALLOW access ONLY if `chv_id` matches user context (Row-Level Security implemented in DB layer, tagged in Atlas).

## 3. Implementation Steps
1. **Infrastructure**: Deploy Apache Atlas via Docker.
2. **Metadata Ingestion**:
   - Use `sync_governance.py` to push PostgreSQL definitions to Atlas.
   - Alternatively, use the `PostgreSQL Hook` for automated updates.
3. **Lineage**:
   - `Excel Import` -> `Python Script` -> `PostgreSQL` -> `PowerBI/Dashboard`
   - Atlas tracks this flow to ensure PII doesn't leak into Dashboards unmasked.

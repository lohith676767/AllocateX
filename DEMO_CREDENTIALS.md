# Demo login credentials

Seeded automatically by `npm run db:seed` and refreshed on every **Reset Demo**.
These are mock accounts for local demo purposes only — never real secrets.

Password for every account below: **`password123`**

## NGO accounts (proposal submission)

| Email | Represents |
|---|---|
| `ngo1@fairfill.demo` | Grameen Swasthya Trust (Bundelkhand) |
| `ngo2@fairfill.demo` | JalDhara Foundation (Vidarbha) |

## Company accounts (proposal inbox + existing FairFill dashboard)

| Email | Represents |
|---|---|
| `company1@fairfill.demo` | Vertex Industries CSR |
| `company2@fairfill.demo` | Horizon Bank CSR Trust **and** Meridian Textiles Foundation (one login, two companies) |

## Demo flow (two browsers/laptops)

1. **NGO laptop**: log in as `ngo1@fairfill.demo` → Submit Proposal → upload `sample-proposal.txt` (in this repo) → select one or more companies → Submit.
2. **Company laptop**: log in as `company1@fairfill.demo` (or `company2@fairfill.demo` if that company was selected) → Inbox → open the new proposal → Accept.
3. On the company account, go to **Overview** → **Generate Allocation** — the accepted proposal is now a real project and gets scored alongside everything else.

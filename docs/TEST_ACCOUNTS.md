# TOTL Test Accounts

Use these credentials to log in locally after running the database seed.

**Password for all accounts:** `Password123!`

---

## Quick Test Account (recommended)

| Email | Password | Role | Redirects to |
|-------|----------|------|--------------|
| **test@totl.local** | Password123! | Talent | `/talent/dashboard` |

---

## Full Seed Accounts

### Talent (Career Builder)
| Email | Name |
|-------|------|
| test@totl.local | Test User |
| emma.seed@thetotlagency.local | Emma Rodriguez |
| marcus.seed@thetotlagency.local | Marcus Johnson |
| sofia.seed@thetotlagency.local | Sofia Chen |
| james.seed@thetotlagency.local | James Wilson |
| isabella.seed@thetotlagency.local | Isabella Martinez |
| alexander.seed@thetotlagency.local | Alexander Thompson |
| olivia.seed@thetotlagency.local | Olivia Davis |
| ethan.seed@thetotlagency.local | Ethan Brown |
| ava.seed@thetotlagency.local | Ava Garcia |
| liam.seed@thetotlagency.local | Liam Anderson |
| mia.seed@thetotlagency.local | Mia Taylor |

### Client (Career Builder / Hiring)
| Email | Name | Notes |
|-------|------|-------|
| lumen.media@thetotlagency.local | Lumen Media | Active client with gigs |
| northwind.events@thetotlagency.local | Northwind Events | Suspended account |

### Admin
| Email | Name | Redirects to |
|-------|------|--------------|
| qa.admin@thetotlagency.local | QA Admin | `/admin/dashboard` |

---

## How to use

1. **Reset the database** (applies the seed):
   ```bash
   npm run db:reset
   ```
   Or: `supabase db reset`

2. **Login** at `/login` with any of the credentials above.

3. **Role-based redirects:**
   - Talent → `/talent/dashboard`
   - Client → `/client/dashboard`
   - Admin → `/admin/dashboard`

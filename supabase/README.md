# FKBC live database (Supabase)

Project: **FKBC Coaches Console** (London). The app talks to it through `assets/live.js`; the public connection
settings are in `assets/live-config.js` (the public *anon* key only – never put the secret/service_role key in the app).

## What is live
| Feature | Table | Who can write |
|---|---|---|
| Coach chat (all-coaches + private) | `messages` | any joined coach, only as themselves |
| Saved lessons (shared club library) | `lessons` | the owning coach (or admin); editing someone else's lesson saves your own copy |
| Weekly timetable | `timetable` | admin (full), allocated coaches (their session's lesson only) |
| Library additions | `club_library` | any joined coach |

## How access works
Each device signs in anonymously, then calls `claim_membership(code, coach)`. The server checks the club code (bcrypt, stored
in `private.club_config`, unreadable by the app) and records the device as that coach. Everything else is row-level-secured to
members. `claim_admin(code)` grants 30 minutes of admin. Failed attempts are throttled.

## Changing the codes
Run in the Supabase SQL editor (or ask Claude to do it):
```sql
update private.club_config set value = extensions.crypt('NEW-ACCESS-CODE', extensions.gen_salt('bf', 10)) where key = 'access_hash';
update private.club_config set value = extensions.crypt('NEW-ADMIN-CODE',  extensions.gen_salt('bf', 10)) where key = 'admin_hash';
```
The app also keeps a local copy of each code's hash (in `index.html`) for offline unlocking – update those two values too
(`ACCESS_H` / `ADMIN_H`, SHA-256 of `fkbc-console:` + the code in upper case).

## Notes
* Free Supabase projects pause after a week of inactivity; the Pro plan avoids that.
* `schema.sql` is safe to re-run. Apply it in the SQL editor of a new project, then set the two codes as above.

# Azure AD App Registration & SharePoint Setup

This app uploads to SharePoint using each user's own Microsoft 365 login via Microsoft Graph. Before that can work, someone with Azure AD (Microsoft Entra) admin rights needs to complete this one-time setup, then the resulting values need to be added to this repo's deploy pipeline.

The app is deployed at: **https://prannet.github.io/PhotoGuider/**

## 1. Register the app in Azure AD

1. Go to the [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name: `PhotoGuider` (or anything recognizable).
3. Supported account types: **Accounts in this organizational directory only** (single tenant), unless you specifically need multi-tenant.
4. Click **Register**.

## 2. Configure authentication

1. In the new app registration, go to **Authentication** → **Add a platform** → **Single-page application (SPA)**.
2. Redirect URI: `https://prannet.github.io/PhotoGuider/`
   - Must match exactly (including the trailing slash) — this is what the app is actually deployed at.
3. Save.

## 3. Grant API permissions

1. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**.
2. Add `Sites.ReadWrite.All` (or a narrower permission scoped to just the target SharePoint site, if you'd rather restrict it).
3. Click **Grant admin consent for [your organization]** — this lets it work without every individual user having to approve the permission themselves on first login.

## 4. Collect the two IDs

On the app registration's **Overview** page, copy:
- **Application (client) ID**
- **Directory (tenant) ID**

## 5. Find the target SharePoint site ID

1. Decide which SharePoint site and document library (folder) the zips should land in — e.g. a library named "Auction Photos" on your team site.
2. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer), sign in with an account that has access to that site.
3. Run a `GET` request:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{site-path}
   ```
   For example, if your site is `https://contoso.sharepoint.com/sites/AuctionTeam`:
   ```
   GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/AuctionTeam
   ```
4. Copy the `id` field from the response — that's the **Site ID**.
5. Note the folder path within that site's default document library where zips should be uploaded (e.g. `Auction Photos`). It must already exist, or be a path Graph can create on first upload — simplest to create the folder yourself ahead of time.

## 6. Add the values as GitHub Actions secrets

The deploy workflow (`.github/workflows/deploy.yml`) now reads these as secrets and passes them into the build, so they need to live in the repo's GitHub settings — not in a local `.env` file, since the build that actually gets deployed runs in GitHub Actions, not on your machine.

1. Go to `https://github.com/Prannet/PhotoGuider/settings/secrets/actions`.
2. Click **New repository secret** and add each of these four (exact names matter):

   | Secret name | Value |
   |---|---|
   | `VITE_AZURE_CLIENT_ID` | Application (client) ID from step 4 |
   | `VITE_AZURE_TENANT_ID` | Directory (tenant) ID from step 4 |
   | `VITE_SHAREPOINT_SITE_ID` | Site ID from step 5 |
   | `VITE_SHAREPOINT_FOLDER_PATH` | Folder path from step 5 (e.g. `Auction Photos`) |

3. Trigger a redeploy so the build picks them up — either push any commit to `master`, or go to the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.

## 7. Test it

Once redeployed, open the live site, finish a session, and tap **Send to SharePoint**. First use will pop up a real Microsoft login — sign in with an account that has access to the target site. If it works, the zip should appear in the SharePoint folder within a few seconds.

If you want to develop/test locally before pushing, you can also copy these same four values into a local `.env` file (see `.env.example`) — `.env` is gitignored, so it never gets committed.

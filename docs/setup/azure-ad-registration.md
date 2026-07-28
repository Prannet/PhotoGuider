# Azure AD App Registration Checklist (for IT)

This app uploads to SharePoint using each coworker's own Microsoft 365 login via Microsoft Graph. Before the app can do that, an Azure AD (Microsoft Entra) admin needs to complete this one-time, free setup.

## Steps

1. Go to the Azure Portal → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name: `Auction Photo Capture`.
3. Supported account types: **Accounts in this organizational directory only** (single tenant).
4. Under **Authentication**:
   - Add a platform of type **Single-page application (SPA)**.
   - Redirect URI: the deployed app's URL (e.g. `https://auction-photos.yourcompany.com`).
5. Under **API permissions**:
   - Add **Microsoft Graph** → **Delegated permissions** → `Sites.ReadWrite.All` (or a narrower permission scoped to the specific SharePoint site, if your security team prefers that).
   - Click **Grant admin consent for [organization]** so individual coworkers are never prompted to approve permissions themselves.
6. Copy the **Application (client) ID** and **Directory (tenant) ID** from the app registration's Overview page.
7. Identify the target SharePoint site and folder (e.g. a document library named "Auction Photos"), and get its **Site ID** via Microsoft Graph Explorer (`GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{site-path}`).

## Values to hand back to the development team

Fill in and return the following, which go into the app's `.env` file (see `.env.example`):

```
VITE_AZURE_CLIENT_ID=<Application (client) ID from step 6>
VITE_AZURE_TENANT_ID=<Directory (tenant) ID from step 6>
VITE_SHAREPOINT_SITE_ID=<Site ID from step 7>
VITE_SHAREPOINT_FOLDER_PATH=<folder path within the site's default drive, e.g. "Auction Photos">
```

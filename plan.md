# ContextFirst Nexus Rapid Setup Plan

## 1. Goal

Create permanent GitHub and Vercel locations for the future ContextFirst Nexus application.

## 2. Problem

The submission needs stable repository and web application URLs before the full platform is implemented.

## 3. Proposed solution

Create a minimal Next.js, TypeScript, and Tailwind project, publish it to a public GitHub repository, connect it to Vercel, and deploy the blank shell to production.

## 4. Files to change

Only files inside this `contextfirst-nexus` project directory. Existing research files in the parent directory remain private and unchanged.

## 5. Step by step tasks

1. Add the minimal application foundation.
2. Install dependencies and verify the production build.
3. Initialize Git and commit the project files.
4. Create and push the public GitHub repository.
5. Connect and deploy the production Vercel project.

## 6. Acceptance criteria

- The GitHub repository is public on the `main` branch.
- The Vercel production URL is stable and linked to this project.
- The site builds successfully and shows a visually blank page.
- No credentials or parent research files are published.

## 7. Testing plan

Run the Next.js production build, inspect the committed file list, confirm the Git remote, and inspect the Vercel project connection.

## 8. Open questions

None for this rapid setup.

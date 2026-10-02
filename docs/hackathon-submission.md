# CLOCK IN submission plan

Status date: 25 September 2026  
Submission deadline: **8 October 2026**

The official Solana Mobile announcement requires:

1. A functional Android APK.
2. A GitHub repository containing the project's source code.
3. A demo video showing the app in use.
4. A pitch deck or short presentation.

The announcement says that a GitHub source repository is required, but it does not explicitly say that the repository must be public. The submission portal still needs a repository the judges can access. Seekase will therefore remain private during development and use one of these final submission paths:

- Grant the judging team access to the private repository if the official submission flow supports it.
- Otherwise publish a sanitized public submission repository immediately before entry. This repository must contain the buildable source and honest setup instructions, but no `.env`, service-role key, Helius key, wallet pepper, signing key, wallet address, local absolute path, production test data or private screenshots.

Making a repository public does not grant an open-source license by itself. Do not add an open-source license unless the owner chooses one.

## Required order

### Now

- Register the project and team on the official CLOCK IN / Radiants submission site.
- Finish P0 physical-device acceptance and the first Mainnet daily check-in.
- Produce a release-signed APK that runs without Metro.
- Freeze the English product copy and capture final device screenshots.

### Before creating the public submission repository

- Run `npm run audit:public`.
- Scan all tracked files and Git history again with a dedicated secret scanner if available.
- Confirm `.env`, Android signing files, Supabase service-role secrets, Helius key and wallet-auth pepper are absent.
- Replace local machine paths and private device identifiers with environment-driven examples.
- Include `.env.example` with placeholders only.
- Explain which Supabase migrations and Edge Functions are required without publishing deployed secrets.
- Confirm the public history contains no deleted secrets. A fresh sanitized repository is safer than publishing the current private history.

### Submission package

- Android APK download link and checksum.
- Public or judge-accessible source repository at the exact submitted commit.
- Short README: problem, target collector, Seeker-first flow, architecture, setup and test instructions.
- Demo video showing wallet entry, public collection creation, photo, discovery/social interaction, private wallet identity, genuine SGT badge and Mainnet check-in.
- Pitch deck explaining stickiness, product-market fit, user experience, innovation, Seeker integration and roadmap.

### After submission

- Keep the submitted commit and APK reproducible.
- Prepare the Solana dApp Store release flow. Store publication is separate from the hackathon source-repository requirement.
- Do not expose production secrets or private user data when answering judge questions.

Official sources: [CLOCK IN announcement](https://solanamobile.com/blog/clock-in-the-solana-mobile-hackathon) and [Solana dApp Store submission](https://docs.solanamobile.com/dapp-store/publishing-cli/submit).

# Optional Seekase NFT Collectibles

## Product boundary

NFT minting is an optional later feature for earned collector milestones. Core collection, profile and social features must remain usable without buying or minting an NFT. Seekase is not an NFT marketplace and will not add checkout, escrow or speculative reward language.

## Architecture decision

A custom Seekase smart contract is not required for the first NFT release. Use an audited standard asset program, with **Metaplex Core** as the preferred candidate. Core represents an NFT with a single account and supports collection membership while avoiding the multi-account layout of older Token Metadata NFTs.

Use one verified Seekase collection and mint eligible assets into it. The backend verifies the user's earned badge and produces a short-lived, single-use mint authorization. The user's connected wallet explicitly approves the Mainnet mint and pays the clearly disclosed network and storage cost. The authority must never live in the mobile app or in a public repository.

A custom program should be considered only when standard Metaplex plugins cannot enforce an approved product rule. It must receive a separate threat model, Devnet test plan, audit decision and explicit Mainnet deployment approval.

## Visual system

NFT artwork is separate from the small in-app badge icon. Each mintable tier needs:

- a square master illustration and export set;
- name, description and stable attributes;
- a consistent Seekase collection mark and tier treatment;
- accessible contrast at thumbnail size;
- permanent image and metadata storage with a tested recovery copy;
- a clear policy for whether artwork/metadata can ever change.

Start with a small set after eligibility rules are final, for example 7-day, 14-day and 30-day streak milestones plus meaningful collection/object milestones. Do not create artwork for undecided rewards.

## Required work before implementation

1. Finalize eligibility, one-per-wallet/account rules, transferability and duplicate handling.
2. Decide whether these are transferable collectibles or non-transferable achievements.
3. Choose who pays mint/storage costs and show the maximum expected cost before wallet approval.
4. Produce and approve the NFT visual masters and metadata schema.
5. Build on Devnet, simulate every transaction and test recovery/idempotency.
6. Review authority custody, abuse controls, collection verification and metadata permanence.
7. Request separate explicit approval before any Mainnet collection creation or mint.

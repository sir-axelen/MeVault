# Collaboration Proposal: Shelby X MeVault

**To: The Shelby Team**
**From: Axel Team**

## Project Overview
We have developed **Shelby X MeVault**, a decentralized hot storage and data-sharing dashboard built on the Aptos blockchain. This project is more than just a storage interface; it is a real-time data ecosystem prioritizing speed, security, and a premium user experience.

## Technical Excellence
Our commitment to building a robust and scalable infrastructure is reflected in our implementation:
- **Aptos JS-Pro SDK Optimization**: Leveraging the latest SDK for high-performance transaction handling and state management.
- **Native Shelby Protocol Integration**: We have migrated our storage engine directly to the Shelby Protocol SDK to support the native ecosystem. We successfully implemented a direct, indexer-free upload workflow using on-chain blob registration (`register_multiple_blobs`) and direct RPC node interactions.
- **Multi-Device Stability**: A resilient wallet connection system featuring autoConnect and a fully responsive UI (optimized for Mobile, Tablet, Desktop, and Vertical monitors).
- **Premium Aesthetics**: A futuristic visual identity using Glassmorphism and high-performance 3D animations (Hyperspeed).

## Unique Value Proposition & Current Status: On-Chain Paywall (Lock File)
A key differentiator of our platform is the **On-Chain Paywall** feature, allowing users to lock their files and set a custom access price in APT.

**Current Implementation Note (Simulated Flow):**
Currently, the "Lock File" transaction flow is running as a **UI simulation (mockup)** rather than executing the actual smart contract calls. 
*Reasoning:* Due to the recent major updates and migration occurring within the Shelby Protocol network and indexers, the actual on-chain lock/unlock transactions frequently encountered timeouts, `Simulation Errors`, and transaction stalls. To prevent these instability issues from breaking the user experience during our showcase or pitch, we have temporarily decoupled the UI from the synchronous blockchain calls. This allows the team to experience the intended workflow seamlessly while we wait for the network's smart contract infrastructure to stabilize post-update.

## Our Commitment
Our vision aligns perfectly with Shelby’s goal of driving mass adoption of decentralized storage on Aptos. We are highly motivated and serious about joining or collaborating further with the Shelby team to strengthen the ecosystem together.

---
**Axel Team**
*Decentralized. Real-Time. Instant Access.*

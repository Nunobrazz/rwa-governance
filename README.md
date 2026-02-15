# Simple DAO - Real World Asset Governance

A simplified Decentralized Autonomous Organization (DAO) designed for Real World Asset (RWA) governance, specifically tailored for Real Estate management using the ERC-1155 standard. This project demonstrates how to tokenize assets, govern them using a DAO structure, and implement specific use cases like "Smart Rent".

## Features

- **RWA Tokenization**: Uses `RWAToken.sol` (ERC-1155) to represent real-world assets.
- **Governance**: Implements `RWAGovernor.sol` for proposal creation, voting, and execution.
- **Voting Power**: `VotesTokenId.sol` tracks voting power based on token holdings.
- **Controlled Issuance**: `Issuer.sol` ensures only authorized entities can mint new asset tokens.
- **Smart Rent Use Case**: `SmartRent.sol` demonstrates how governance can manage lease agreements, tenants, and rent settings.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Hardhat](https://hardhat.org/)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rwa-governance
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The project uses Hardhat configuration variables. You must set the following variables before running the project:

```bash
npx hardhat vars set PRIVATE_KEY_FUJI
npx hardhat vars set SEPOLIA_PRIVATE_KEY
npx hardhat vars set API_URL
```

- `PRIVATE_KEY_FUJI`: Private key for the Avalanche Fuji testnet.
- `SEPOLIA_PRIVATE_KEY`: Private key for the Sepolia testnet.
- `API_URL`: RPC URL for Sepolia.

## Usage

### Compile Contracts

Compile the Solidity smart contracts:

```bash
npx hardhat compile
```

### Run Tests

Run the included test suite (currently includes default Hardhat locking tests, extend validation here):

```bash
npx hardhat test
```

### Deployment & Governance Demo

The project includes a script to demonstrate the full lifecycle of the governance process, including:
1. Deploying contracts (`RWAToken`, `Issuer`, `RWAGovernor`, `SmartRent`).
2. Issuing tokens (e.g., "House 1").
3. Establishing a lease agreement.
4. Token transfers and voting power delegation.
5. Creating a proposal (e.g., to add `SmartRent` as a valid target for governance).
6. Voting on the proposal.
7. Executing the proposal after the voting period.
8. Creating and executing a second proposal (e.g., to set a tenant).

Run the demonstration script:

```bash
npx hardhat run scripts/Governance.mjs
```

## Architecture Overview

- **RWAToken (ERC-1155)**: The core asset token. It supports multiple distinct assets (Token IDs) within a single contract.
- **Issuer**: A dedicated contract with the authority to mint `RWAToken` assets. Segregates minting logic from the token contract.
- **RWAGovernor**: The governance engine (OpenZeppelin Governor). It manages proposals and counts votes.
- **SmartRent**: An example contract governed by the DAO. It holds state regarding a property's lease (tenant, rent, payment dates) and allows the DAO to update these parameters via successful proposals.

## License

ISC

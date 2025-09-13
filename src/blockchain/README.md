# Blockchain Integration

## Files
- `interaction_hash.js`: Main blockchain interaction logic
- `abi/abi.json`: Smart contract ABI
- `sample_usage.js`: Example usage of blockchain functions

## Environment Variables
Copy `.env.example` to `.env` and fill in:
- `CONTRACT_ADDRESS`: Your deployed contract address
- `RPC_URL`: Your blockchain node RPC URL
- `PRIVATE_KEY`: Private key for the wallet to sign transactions

## Usage
You can use the functions in `interaction_hash.js` in any backend module. Example:

```js
const { mintUser, getInfoByTokenId } = require('./blockchain/interaction_hash');

// Mint a new user NFT
const { tokenId } = await mintUser('user@email.com', 'active', 'New York');

// Get info by tokenId
const info = await getInfoByTokenId(tokenId);
```

## Testing
Run the sample script:

```bash
node src/blockchain/sample_usage.js
```

## Integration
- Import and use blockchain functions in your service or controller files as needed.
- Ensure your environment variables are set up for production and development.

## Dependencies
- `ethers`
- `dotenv`

Install with:
```bash
npm install ethers dotenv
```

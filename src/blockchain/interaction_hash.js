const { ethers } = require('ethers');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const path = require('path');
const ABI_PATH = path.join(__dirname, 'abi', 'abi.json');
const ABI = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'));

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL) {
  throw new Error('Missing environment variables');
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const signer = wallet.connect(provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

async function getOwnerAddress() {
  return await signer.getAddress();
}

async function mintUser(email, status, place) {
  const userHash = ethers.keccak256(ethers.toUtf8Bytes(email));
  const toAddress = await signer.getAddress();
  const tx = await contract.mint(toAddress, userHash, status, place, { gasLimit: 300000 });
  const receipt = await tx.wait();
  const tokenId = receipt.logs[0]?.topics[3] ? BigInt(receipt.logs[0].topics[3]).toString() : null;
  return { tokenId, txHash: tx.hash };
}

async function getInfoByTokenId(tokenId) {
  const [status, place, hash, owner] = await contract.getInfo(BigInt(tokenId));
  return { status, place, hash, owner };
}

async function getInfoByHash(email) {
  const userHash = ethers.keccak256(ethers.toUtf8Bytes(email));
  const [status, place, tokenId, owner] = await contract.getInfoByHash(userHash);
  return { status, place, tokenId: tokenId.toString(), owner };
}

async function updateByTokenId(tokenId, newStatus, newPlace) {
  const tx = await contract.update(BigInt(tokenId), newStatus, newPlace, { gasLimit: 200000 });
  await tx.wait();
  const [updatedStatus] = await contract.getInfo(BigInt(tokenId));
  return { updatedStatus, txHash: tx.hash };
}

async function updateByHash(email, newStatus, newPlace) {
  const userHash = ethers.keccak256(ethers.toUtf8Bytes(email));
  const tx = await contract.updateByHash(userHash, newStatus, newPlace, { gasLimit: 200000 });
  await tx.wait();
  const [updatedStatus] = await contract.getInfoByHash(userHash);
  return { updatedStatus, txHash: tx.hash };
}

async function burnByTokenId(tokenId) {
  const tx = await contract.burn(BigInt(tokenId), { gasLimit: 200000 });
  await tx.wait();
  return { txHash: tx.hash };
}

async function burnByHash(email) {
  const userHash = ethers.keccak256(ethers.toUtf8Bytes(email));
  const tx = await contract.burnByHash(userHash, { gasLimit: 200000 });
  await tx.wait();
  return { txHash: tx.hash };
}

module.exports = {
  provider,
  signer,
  contract,
  getOwnerAddress,
  mintUser,
  getInfoByTokenId,
  getInfoByHash,
  updateByTokenId,
  updateByHash,
  burnByTokenId,
  burnByHash
};
const {
  mintUser,
  getInfoByTokenId,
  getInfoByHash,
  updateByTokenId,
  updateByHash,
  burnByTokenId,
  burnByHash
} = require('./interaction_hash');

async function run() {
  const hash = 'keckkack256hashofuserpassportno-oradhaarno';
  
  const { tokenId } = await mintUser(hash, 'active', 'New York');
  console.log('Minted Token ID:', tokenId);

  const info = await getInfoByTokenId(tokenId);
  console.log('Info by token ID:', info);

  const infoByHash = await getInfoByHash(hash);
  console.log('Info by hash:', infoByHash);

  const updateResult = await updateByTokenId(tokenId, 'inactive', 'Los Angeles');
  console.log('Updated status:', updateResult);

  const updateByHashResult = await updateByHash(hash, 'pending', 'San Francisco');
  console.log('Updated by hash:', updateByHashResult);

  const burnResult = await burnByTokenId(tokenId);
  console.log('Burned by token ID:', burnResult);

  const burnByHashResult = await burnByHash(hash);
  console.log('Burned by hash:', burnByHashResult);
}

run().catch(console.error);

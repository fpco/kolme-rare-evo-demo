import { encrypt, decrypt } from 'kolme-client/crypto'
import { KolmeClient } from 'kolme-client'

export const client = new KolmeClient('http://localhost:3000');

const generateAndStorePrivateKey = async (encryptionKey: string) => {
  const privateKey = client.generatePrivateKey();
  const encryptedPrivateKey = await encrypt({
    message: Buffer.from(privateKey).toString('hex'), 
    key: encryptionKey 
  });

  localStorage.setItem('your_key', encryptedPrivateKey)
}

const getPrivateKey = async (encryptionKey: string) => {
  const encryptedPrivateKey = localStorage.getItem('your_key');

    if (!encryptedPrivateKey) {
        throw new Error('No private key found in local storage');
    }

  const privateKey = await decrypt({
    encryptedMessage: encryptedPrivateKey, 
    key: encryptionKey
  });

  return Buffer.from(privateKey, 'hex')
}

// You need to figure out how to get and secure this
const encryptionKey = '123456789';

await generateAndStorePrivateKey(encryptionKey);
export const privateKey = await getPrivateKey(encryptionKey);

export const claimFunds = async () => {
  
  const block = await client.broadcast(privateKey, [{
      App:{
        "grab-funds": {}
      }
  }]);
  
  return block;
};

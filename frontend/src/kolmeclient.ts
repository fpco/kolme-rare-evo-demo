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

// Get encryption key from localStorage or use default
const getEncryptionKey = () => {
  return localStorage.getItem('user_encryption_key') || 'user1';
};

export const setEncryptionKey = async (newKey: string) => {
  localStorage.setItem('user_encryption_key', newKey);
  localStorage.removeItem('your_key');
  window.location.reload();
};

const encryptionKey = getEncryptionKey();

await generateAndStorePrivateKey(encryptionKey);
export const privateKey = await getPrivateKey(encryptionKey);

export const getPublicKey = () => {
  return client.getPublicKey(privateKey);
};

// Get current user info (public key as identifier)
export const getCurrentUser = () => {
  const publicKey = client.getPublicKey(privateKey);
  const publicKeyHex = Buffer.from(publicKey).toString('hex');
  return {
    publicKey: publicKeyHex,
    shortAddress: `${publicKeyHex.slice(0, 6)}...${publicKeyHex.slice(-4)}`,
    encryptionKey: encryptionKey 
  };
};

export const claimFunds = async () => {
  
  const block = await client.broadcast(privateKey, [{
      App:{
        "grab-funds": {}
      }
  }]);
  
  return block;
};

export const placeBet = async (guess: number, amount: number) => {
  if (guess < 0 || guess > 255) {
    throw new Error('Guess must be between 0 and 255');
  }
  
  const block = await client.broadcast(privateKey, [{
    App: {
      "place-bet": {
        guess,
        amount: amount.toString()
      }
    }
  }]);
  
  return block;
};

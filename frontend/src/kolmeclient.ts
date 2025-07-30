import { encrypt, decrypt } from 'kolme-client/crypto'
import { KolmeClient } from 'kolme-client'

export const client = new KolmeClient('http://nlb.prod.fpcomplete.com:3000/');

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

// Generate a random user key if none exists
const generateRandomUserKey = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Get or generate user key
const getUserKey = () => {
  let userKey = localStorage.getItem('userKey');
  if (!userKey) {
    userKey = generateRandomUserKey();
    localStorage.setItem('userKey', userKey);
    // Initialize funds tracking for new user
    localStorage.setItem(`hasClaimedFunds_${userKey}`, 'false');
    localStorage.setItem(`fundsAmount_${userKey}`, '0');
  }
  return userKey;
};

// Check if user has already claimed funds
export const hasClaimedFunds = () => {
  const userKey = getUserKey();
  return localStorage.getItem(`hasClaimedFunds_${userKey}`) === 'true';
};

// Set that user has claimed funds and add 100 to their balance
export const setFundsClaimed = () => {
  const userKey = getUserKey();
  localStorage.setItem(`hasClaimedFunds_${userKey}`, 'true');
  const currentFunds = parseInt(localStorage.getItem(`fundsAmount_${userKey}`) || '0');
  localStorage.setItem(`fundsAmount_${userKey}`, (currentFunds + 100).toString());
  
  // Dispatch event to notify components about funds update
  window.dispatchEvent(new CustomEvent('fundsUpdated'));
};

// Get user's current funds amount
export const getUserFunds = () => {
  const userKey = getUserKey();
  return parseInt(localStorage.getItem(`fundsAmount_${userKey}`) || '0');
};

// Subtract funds after betting
export const subtractFunds = (amount: number) => {
  const userKey = getUserKey();
  const currentFunds = getUserFunds();
  if (currentFunds < amount) {
    throw new Error('Insufficient funds');
  }
  localStorage.setItem(`fundsAmount_${userKey}`, (currentFunds - amount).toString());
  
  // Dispatch event to notify components about funds update
  window.dispatchEvent(new CustomEvent('fundsUpdated'));
};

// Check if user has sufficient funds
export const hasSufficientFunds = (amount: number) => {
  return getUserFunds() >= amount;
};

const encryptionKey = getUserKey();

await generateAndStorePrivateKey(encryptionKey);
export const privateKey = await getPrivateKey(encryptionKey);

export const getPublicKey = () => {
  return client.getPublicKey(privateKey);
};

// Get current user info (public key as identifier)
export const getCurrentUser = () => {
  const publicKey = client.getPublicKey(privateKey);
  const publicKeyHex = Buffer.from(publicKey).toString('hex');
  const userKey = getUserKey();
  const funds = getUserFunds();
  return {
    publicKey: publicKeyHex,
    shortAddress: `${publicKeyHex.slice(0, 6)}...${publicKeyHex.slice(-4)}`,
    userKey: userKey,
    funds: funds
  };
};

export const claimFunds = async () => {
  if (hasClaimedFunds()) {
    throw new Error('Funds have already been claimed for this user');
  }
  
  const block = await client.broadcast(privateKey, [{
      App:{
        "grab-funds": {}
      }
  }]);
  
  // Mark funds as claimed and add 100 to balance
  setFundsClaimed();
  
  return block;
};

export const placeBet = async (guess: number, amount: number) => {
  if (guess < 0 || guess > 255) {
    throw new Error('Guess must be between 0 and 255');
  }
  
  if (!hasSufficientFunds(amount)) {
    throw new Error(`Insufficient funds. You have ${getUserFunds()} funds but need ${amount}`);
  }
  
  const block = await client.broadcast(privateKey, [{
    App: {
      "place-bet": {
        guess,
        amount: amount.toString()
      }
    }
  }]);
  
  // Subtract funds from local storage after successful bet
  subtractFunds(amount);
  
  return block;
};

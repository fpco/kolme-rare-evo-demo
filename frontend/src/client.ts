import { Buffer } from 'buffer'
import { KolmeClient } from 'kolme-client'
import { decrypt, encrypt } from 'kolme-client/crypto'

import { API_BASE_URL } from './api/gameApi'

export const client = new KolmeClient(API_BASE_URL)

client.subscribeToNotifications((message) => {
  console.log('Received message:', message)
})

const generateRandomKey = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

const getEncryptionKey = () => {
  let encryptionKey = localStorage.getItem('encryptionKey')
  if (!encryptionKey) {
    encryptionKey = generateRandomKey()
    localStorage.setItem('encryptionKey', encryptionKey)
  }
  return encryptionKey
}

const encryptionKey = getEncryptionKey()

const getPrivateKey = async () => {
  const encryptedPrivateKey = localStorage.getItem('privateKey')

  if (!encryptedPrivateKey) {
    const privateKey = client.generatePrivateKey()
    const encryptedPrivateKey = await encrypt({
      message: Buffer.from(privateKey).toString('hex'),
      key: encryptionKey,
    })

    localStorage.setItem('privateKey', encryptedPrivateKey)
    return privateKey
  }

  const privateKey = await decrypt({
    encryptedMessage: encryptedPrivateKey,
    key: encryptionKey,
  })

  return Buffer.from(privateKey, 'hex')
}

export const privateKey = await getPrivateKey()

const getPublicKey = async () => {
  const publicKey = client.getPublicKey(privateKey)
  return Buffer.from(publicKey).toString('hex')
}

export const publicKey = await getPublicKey()

export const hasClaimedFunds = () => {
  return localStorage.getItem(`hasClaimedFunds_${publicKey}`) === 'true'
}

export const setFundsClaimed = () => {
  localStorage.setItem(`hasClaimedFunds_${publicKey}`, 'true')
  const currentFunds = Number.parseFloat(
    localStorage.getItem(`fundsAmount_${publicKey}`) || '0',
  )
  localStorage.setItem(
    `fundsAmount_${publicKey}`,
    (currentFunds + 100).toString(),
  )
}

export const getUserFunds = () => {
  return Number.parseFloat(
    localStorage.getItem(`fundsAmount_${publicKey}`) || '0',
  )
}

export const subtractFunds = (amount: number) => {
  const currentFunds = getUserFunds()
  if (currentFunds < amount) {
    throw new Error('Insufficient funds')
  }
  localStorage.setItem(
    `fundsAmount_${publicKey}`,
    (currentFunds - amount).toString(),
  )
}

export const hasSufficientFunds = (amount: number) => {
  return getUserFunds() >= amount
}

export const claimFunds = async () => {
  if (hasClaimedFunds()) {
    throw new Error('Funds have already been claimed for this user')
  }

  const block = await client.broadcast(privateKey, [
    {
      App: {
        'grab-funds': {},
      },
    },
  ])

  setFundsClaimed()

  return block
}

export const placeBet = async (guess: number, amount: number) => {
  if (guess < 0 || guess > 255) {
    throw new Error('Guess must be between 0 and 255')
  }

  if (!hasSufficientFunds(amount)) {
    throw new Error(
      `Insufficient funds. You have ${getUserFunds()} funds but need ${amount}`,
    )
  }

  const block = await client.broadcast(privateKey, [
    {
      App: {
        'place-bet': {
          guess,
          amount: amount.toString(),
        },
      },
    },
  ])

  subtractFunds(amount)

  return block
}

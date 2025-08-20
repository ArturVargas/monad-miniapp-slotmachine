export const USDC_CONTRACT_ADDRESS = '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'
export const SLOT_MACHINE_CONTRACT_ADDRESS = '0xe42682B8162C53BA089833b7ba8f843C05C6DE1E'

export const SLOT_MACHINE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "wager",
        "type": "uint256"
      }
    ],
    "name": "spinWithUSDC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBetUSDC",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBetUSDC",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdcDecimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
import 'hardhat-deploy'
import type { HardhatUserConfig } from 'hardhat/config'
import 'solidity-coverage'
import 'tsconfig-paths/register'
import '@typechain/hardhat'

dotenv.config()

const config: HardhatUserConfig = {
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6'
  },
  namedAccounts: {
    L1_BRIDGE_REGISTRY: {
      hardhat: '0x39d43281A4A5e922AB0DCf89825D73273D8C5BA4'
    },
    TON: {
      hardhat: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5'
    },
    WTON: {
      hardhat: '0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2'
    },
    LAYER2_MANAGER: {
      hardhat: '0xD6Bf6B2b7553c8064Ba763AD6989829060FdFC1D'
    },
    DEPOSIT_MANAGER: {
      hardhat: '0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e'
    },
    SEIG_MANAGER: {
      hardhat: '0x0b55a0f463b6defb81c6063973763951712d0e5f'
    },
    DAO_COMMITTEE: {
      hardhat: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26'
    }
  },
  defaultNetwork:
    process.argv[2] === 'test' || process.argv[2] === 'coverage' ? 'hardhat' : process.env.NETWORK || 'mainnet',
  networks: {
    hardhat: {
      // forking: {
      //   url:
      //     process.env.FORK_NETWORK === 'mainnet'
      //       ? process.env.MAINNET_RPC_URL || ''
      //       : process.env.SEPOLIA_RPC_URL || '',
      //   blockNumber: process.env.FORK_BLOCK_NUMBER ? Number(process.env.FORK_BLOCK_NUMBER) : 22224849
      // },
      allowUnlimitedContractSize: false
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || '',
      accounts: [process.env.PRIVATE_KEY || '']
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY || '']
    }
  },
  solidity: {
    compilers: [
      {
        version: '0.8.28',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200
          },
          metadata: {
            bytecodeHash: 'none'
          }
        }
      }
    ]
  },
  mocha: {
    timeout: 200000
  }
}

export default config

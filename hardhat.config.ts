import type { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'solidity-coverage'
import 'hardhat-deploy'

const config: HardhatUserConfig = {
  namedAccounts: {
    TON: {
      hardhat: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044'
    },
    WTON: {
      hardhat: '0x79e0d92670106c85e9067b56b8f674340dca0bbd'
    }
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: 'https://sepolia.infura.io/v3/2TsAk4PhKynxeFu7gonvK63qato',
        blockNumber: 7933538
      },
      allowUnlimitedContractSize: false
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
  }
}

export default config

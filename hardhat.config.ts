import type { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'solidity-coverage'
import 'hardhat-deploy'
import 'tsconfig-paths/register'
import '@nomicfoundation/hardhat-chai-matchers'
// MultisigWallet  0xE3F72E959834d0A72aFb2ea79F5ec2b4243d2d95

// DAOCommitteeProxy 0xDD9f0cCc044B0781289Ee318e5971b0139602C26
// DAOAgendaManager 0xcD4421d082752f363E1687544a09d5112cD4f484
// DepositManagerProxy 0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e
// SeigManagerProxy 0x0b55a0f463b6defb81c6063973763951712d0e5f
// Layer2RegistryProxy 0x7846c2248a7b4de77e9c2bae7fbb93bfc286837b
// CoinageFactory 0xe8fae91b80dd515c3d8b9fc02cb5b2ecfddabf43
// CandidateFactoryProxy 0x9fc7100a16407ee24a79c834a56e6eca555a5d7c

// L1BridgeRegistryProxy  0x39d43281A4A5e922AB0DCf89825D73273D8C5BA4
// CandidateAddOnFactoryProxy 0xFA8ce5caF456115E72B96E5074769b8f66AA5861
// Layer2ManagerProxy  0xD6Bf6B2b7553c8064Ba763AD6989829060FdFC1D
// OperatorManagerFactory 0xAf86b21edDdC78ea27E23A7F2151d60d4e069450

// TON: 0x2be5e8c109e2197D077D13A82dAead6a9b3433C5
// WTON: 0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2

const config: HardhatUserConfig = {
  namedAccounts: {
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
    }
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: '',
        blockNumber: 22224849
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
  },
  mocha: {
    timeout: 200000
  }
}

export default config

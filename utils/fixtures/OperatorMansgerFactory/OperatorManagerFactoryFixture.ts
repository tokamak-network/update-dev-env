import { deployOperatorManager } from '@/fixtures'
import { ethers, getNamedAccounts } from 'hardhat'

const deployOperatorManagerFactory = async () => {
  const { operatorManagerImpl } = await deployOperatorManager()
  const operatorManagerFactory = await ethers.deployContract('OperatorManagerFactory', [operatorManagerImpl.target])
  const { DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts()
  await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)
  return { operatorManagerFactory, operatorManagerImpl }
}

export { deployOperatorManagerFactory }

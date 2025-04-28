import { ethers } from 'hardhat'

const deployOperatorManager = async () => {
  const operatorManagerImpl = await ethers.deployContract('OperatorManagerV1_1')
  return { operatorManagerImpl }
}

export { deployOperatorManager }

import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('OperatorManagerProxy Test', () => {
  it('deploy OperatorManagerProxy with ZeroAddress rollupConfig', async () => {
    await expect(ethers.deployContract('OperatorManagerProxy', [ethers.ZeroAddress])).to.be.revertedWith(
      'zero rollupConfig'
    )
  })
  it('should store rollupConfig address in storage slot', async () => {
    const fakerRollupConfig = ethers.Wallet.createRandom().address
    const proxy = await ethers.deployContract('OperatorManagerProxy', [fakerRollupConfig])
    const storedValue = await ethers.provider.getStorage(
      proxy.target,
      '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6'
    )
    expect(storedValue).to.equal(`0x000000000000000000000000${fakerRollupConfig.toLowerCase().slice(2)}`)
  })

  it('should set implementation address correctly', async () => {
    const fakerRollupConfig = ethers.Wallet.createRandom().address
    const proxy = await ethers.deployContract('OperatorManagerProxy', [fakerRollupConfig])
    const implementation = await ethers.deployContract('OperatorManagerV1_1')
    await proxy.upgradeTo(implementation.target)
    const storedImplementation = await proxy.implementation()
    expect(storedImplementation).to.equal(implementation.target)
  })

  it('should set implementation and call transferManager function', async () => {
    const fakerRollupConfig = ethers.Wallet.createRandom().address
    const operatorManagerProxy = await ethers.deployContract('OperatorManagerProxy', [fakerRollupConfig])
    const operatorManager = await ethers.getContractAt('OperatorManagerV1_1', operatorManagerProxy.target)
    const fakeManager = ethers.Wallet.createRandom().address
    const implementation = await ethers.deployContract('OperatorManagerV1_1')
    await operatorManagerProxy.upgradeToAndCall(
      implementation.target,
      implementation.interface.encodeFunctionData('transferManager', [fakeManager])
    )
    expect(await operatorManager.manager()).to.equal(fakeManager)
  })
})

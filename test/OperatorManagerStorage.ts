import { loadFixture, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('OperatorManagerV1_1 Test', () => {
  const deployOperatorManagerStorage = async () => {
    const address = ethers.Wallet.createRandom().address
    const operatorManagerStroage = await ethers.deployContract('OperatorManagerStorage')
    return { operatorManagerStroage, address }
  }

  it('ton', async () => {
    const { operatorManagerStroage, address } = await loadFixture(deployOperatorManagerStorage)
    setStorageAt(
      operatorManagerStroage.target.toString(),
      '0x88940a795d305b6429c31402afcae61ef7d829b8a9fe2a9861b8c30cd60e80ec',
      address
    )
    expect(await operatorManagerStroage.ton()).to.equal(address)
  })

  it('wton', async () => {
    const { operatorManagerStroage, address } = await loadFixture(deployOperatorManagerStorage)
    setStorageAt(
      operatorManagerStroage.target.toString(),
      '0x5fa7357c3468b094bc9c15b746af6189f046af1501ae9751f49e7b4dd5616e97',
      address
    )
    expect(await operatorManagerStroage.wton()).to.equal(address)
  })

  it('layer2Manager', async () => {
    const { operatorManagerStroage, address } = await loadFixture(deployOperatorManagerStorage)
    setStorageAt(
      operatorManagerStroage.target.toString(),
      '0x1e5e236e704b4589753ab620fd23d3321a80f8eee20526988a54214ac5af8eed',
      address
    )
    expect(await operatorManagerStroage.layer2Manager()).to.equal(address)
  })

  it('depositManager', async () => {
    const { operatorManagerStroage, address } = await loadFixture(deployOperatorManagerStorage)
    setStorageAt(
      operatorManagerStroage.target.toString(),
      '0x6ab12bb59b8ea07c1cc11427fce17c9e354c419041651472a04b9843d34380a9',
      address
    )
    expect(await operatorManagerStroage.depositManager()).to.equal(address)
  })

  it('rollupConfig', async () => {
    const { operatorManagerStroage, address } = await loadFixture(deployOperatorManagerStorage)
    setStorageAt(
      operatorManagerStroage.target.toString(),
      '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
      address
    )
    expect(await operatorManagerStroage.rollupConfig()).to.equal(address)
  })

  it('manager', async () => {
    const { operatorManagerStroage, address } = await loadFixture(deployOperatorManagerStorage)
    setStorageAt(
      operatorManagerStroage.target.toString(),
      '0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02b',
      address
    )
    expect(await operatorManagerStroage.manager()).to.equal(address)
  })
})

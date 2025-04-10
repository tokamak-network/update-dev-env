import { expect } from 'chai'
import type { Addressable } from 'ethers'
import { ethers, getNamedAccounts, network } from 'hardhat'

const fundingETH = (address: string | Addressable, amount = 100) =>
  network.provider.send('hardhat_setBalance', [address, `0x${ethers.parseEther(amount.toString()).toString(16)}`])

describe('OperatorManagerV1_1 Test', () => {
  it('should fail when non-owner tries to set addresses', async () => {
    const { DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts()
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    const [, nonOwner] = await ethers.getSigners()

    await expect(
      operatorManager.connect(nonOwner).setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should assign the deployer as the owner after deployment', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    expect(await operatorManager.owner()).to.equal((await ethers.getSigners())[0].address)
  })

  it('should set addresses correctly', async () => {
    const { DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts()
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)

    expect(
      await ethers.provider.getStorage(
        operatorManager.target,
        '0x1e5e236e704b4589753ab620fd23d3321a80f8eee20526988a54214ac5af8eed'
      )
    ).to.equal(`0x000000000000000000000000${LAYER2_MANAGER.slice(2).toLowerCase()}`)

    expect(
      await ethers.provider.getStorage(
        operatorManager.target,
        '0x6ab12bb59b8ea07c1cc11427fce17c9e354c419041651472a04b9843d34380a9'
      )
    ).to.equal(`0x000000000000000000000000${DEPOSIT_MANAGER.slice(2).toLowerCase()}`)

    expect(
      await ethers.provider.getStorage(
        operatorManager.target,
        '0x5fa7357c3468b094bc9c15b746af6189f046af1501ae9751f49e7b4dd5616e97'
      )
    ).to.equal(`0x000000000000000000000000${WTON.slice(2).toLowerCase()}`)

    expect(
      await ethers.provider.getStorage(
        operatorManager.target,
        '0x88940a795d305b6429c31402afcae61ef7d829b8a9fe2a9861b8c30cd60e80ec'
      )
    ).to.equal(`0x000000000000000000000000${TON.slice(2).toLowerCase()}`)
  })

  it('should manager can transfer manager', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    expect(await operatorManager.manager()).to.equal(ethers.ZeroAddress)

    const manager = ethers.Wallet.createRandom(ethers.provider)
    await operatorManager.transferManager(manager.address)
    expect(await operatorManager.manager()).to.equal(manager.address)

    await fundingETH(manager.address)
    const newManager = ethers.Wallet.createRandom()
    await operatorManager.connect(manager).transferManager(newManager.address)
    expect(await operatorManager.manager()).to.equal(newManager.address)
  })

  it('should fail when setting addresses with zero address', async () => {
    const { DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts()
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')

    await expect(operatorManager.setAddresses(ethers.ZeroAddress, DEPOSIT_MANAGER, TON, WTON)).to.be.revertedWith(
      'zero address'
    )

    await expect(operatorManager.setAddresses(LAYER2_MANAGER, ethers.ZeroAddress, TON, WTON)).to.be.revertedWith(
      'zero address'
    )

    await expect(
      operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, ethers.ZeroAddress, WTON)
    ).to.be.revertedWith('zero address')

    await expect(
      operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, ethers.ZeroAddress)
    ).to.be.revertedWith('zero address')
  })

  it('should fail when setting addresses twice', async () => {
    const { DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts()
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')

    await operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)

    await expect(
      operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)
    ).to.be.revertedWithCustomError(operatorManager, 'AlreadySetError')
  })

  it('should fail when non-owner tries to transfer manager', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await expect(
      operatorManager
        .connect(ethers.Wallet.createRandom(ethers.provider))
        .transferManager(ethers.Wallet.createRandom().address)
    ).to.be.revertedWith('not onlyOwnerOrManager')
  })

  it('should fail when same address is set as manager', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await operatorManager.transferManager((await ethers.getSigners())[0].address)
    await expect(operatorManager.transferManager((await ethers.getSigners())[0].address)).to.be.revertedWithCustomError(
      operatorManager,
      'SameAddressError'
    )
  })

  it('should fail when non-owner tries to claim ETH', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await expect(operatorManager.connect(ethers.Wallet.createRandom(ethers.provider)).claimETH()).to.be.revertedWith(
      'not onlyOwnerOrManager'
    )
  })

  it('should fail when non-owner tries to claim ERC20', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await expect(
      operatorManager.connect(ethers.Wallet.createRandom(ethers.provider)).claimERC20(ethers.ZeroAddress, 100)
    ).to.be.revertedWith('not onlyOwnerOrManager')
  })

  it("manager's ETH balance should increase by the contract's ETH balance after calling claimETH", async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')

    const manager = ethers.Wallet.createRandom()
    await operatorManager.transferManager(manager.address)

    await fundingETH(operatorManager.target)
    await operatorManager.claimETH()

    expect(await ethers.provider.getBalance(manager.address)).to.equal(ethers.parseEther('100'))
  })

  it("manager's ETH balance should increase by the contract's ETH balance after calling claimERC20 with zero address", async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')

    const manager = ethers.Wallet.createRandom()
    await operatorManager.transferManager(manager.address)

    await fundingETH(operatorManager.target)
    await operatorManager.claimERC20(ethers.ZeroAddress, ethers.parseEther('100'))

    expect(await ethers.provider.getBalance(manager.address)).to.equal(ethers.parseEther('100'))
  })

  it('should fail when manager tries to claim ERC20 with insufficient balance', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')

    const manager = ethers.Wallet.createRandom()
    await operatorManager.transferManager(manager.address)

    await expect(
      operatorManager.claimERC20(ethers.ZeroAddress, ethers.parseEther('100'))
    ).to.be.revertedWithCustomError(operatorManager, 'InsufficientBalanceError')
  })

  it('should fail acquireManager when not unsafeBlockSigner', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    const rollupConfig = await ethers.deployContract('RollupConfig')
    await rollupConfig.setUnsafeBlockSigner(ethers.Wallet.createRandom().address)

    await network.provider.send('hardhat_setStorageAt', [
      operatorManager.target,
      '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
      `0x000000000000000000000000${rollupConfig.target.toString().slice(2).toLowerCase()}`
    ])

    await expect(operatorManager.acquireManager()).to.be.revertedWith("not config's seigniorageReceiver")
  })

  it('manager should be changed after calling acquireManager from unsafeBlockSigner', async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    const rollupConfig = await ethers.deployContract('RollupConfig')
    const unsafeBlockSigner = ethers.Wallet.createRandom(ethers.provider)
    await rollupConfig.setUnsafeBlockSigner(unsafeBlockSigner.address)

    await network.provider.send('hardhat_setStorageAt', [
      operatorManager.target,
      '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
      `0x000000000000000000000000${rollupConfig.target.toString().slice(2).toLowerCase()}`
    ])

    await fundingETH(unsafeBlockSigner.address)
    await operatorManager.connect(unsafeBlockSigner).acquireManager()
    expect(await operatorManager.manager()).to.be.equal(unsafeBlockSigner.address)
  })

  // requestWithdrawal
  // processRequest
  // processRequests
})

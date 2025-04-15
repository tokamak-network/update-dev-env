import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import type { HDNodeWallet } from 'ethers'
import { ethers, getNamedAccounts, network } from 'hardhat'
import type { OperatorManagerV1_1, RollupConfig } from '../typechain-types'
import { funding } from '../utils'

describe('OperatorManagerV1_1 Test', () => {
  let operatorManager: OperatorManagerV1_1
  let DEPOSIT_MANAGER: string
  let LAYER2_MANAGER: string
  let TON: string
  let WTON: string

  const snapshot = async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    return { operatorManager }
  }

  beforeEach(async () => {
    ;({ operatorManager } = await loadFixture(snapshot))
    ;({ DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts())
  })

  describe('Test for Contract Deployment', () => {
    it('should assign the deployer as the owner after deployment', async () => {
      expect(await operatorManager.owner()).to.equal((await ethers.getSigners())[0].address)
    })
  })

  describe('Testing for Addresses Setup', () => {
    it('should fail when non-owner tries to set addresses', async () => {
      const [, nonOwner] = await ethers.getSigners()
      await expect(
        operatorManager.connect(nonOwner).setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should fail when tries to set address twice', async () => {
      await operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)
      await expect(
        operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, WTON)
      ).to.be.revertedWithCustomError(operatorManager, 'AlreadySetError')
    })

    it('should fail when set _depositManager to the zero address', async () => {
      await expect(operatorManager.setAddresses(LAYER2_MANAGER, ethers.ZeroAddress, TON, WTON)).to.be.revertedWith(
        'zero address'
      )
    })

    it('should fail when set _ton to the zero address', async () => {
      await expect(
        operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, ethers.ZeroAddress, WTON)
      ).to.be.revertedWith('zero address')
    })

    it('should fail when set _wton to the zero address', async () => {
      await expect(
        operatorManager.setAddresses(LAYER2_MANAGER, DEPOSIT_MANAGER, TON, ethers.ZeroAddress)
      ).to.be.revertedWith('zero address')
    })

    it('should fail when set _layer2Manager to the zero address', async () => {
      await expect(operatorManager.setAddresses(ethers.ZeroAddress, DEPOSIT_MANAGER, TON, WTON)).to.be.revertedWith(
        'zero address'
      )
    })

    it('should set addresses correctly', async () => {
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
  })

  describe('Testing for Transfer Manager', () => {
    it('should fail when non-owner tries to claim ETH', async () => {
      await expect(operatorManager.connect(ethers.Wallet.createRandom(ethers.provider)).claimETH()).to.be.revertedWith(
        'not onlyOwnerOrManager'
      )
    })

    it('should fail when setting the same address as manager', async () => {
      await operatorManager.transferManager((await ethers.getSigners())[0].address)
      await expect(
        operatorManager.transferManager((await ethers.getSigners())[0].address)
      ).to.be.revertedWithCustomError(operatorManager, 'SameAddressError')
    })

    it('should set manager to new manager', async () => {
      const manager = ethers.Wallet.createRandom(ethers.provider)
      await operatorManager.transferManager(manager.address)
      expect(await operatorManager.manager()).to.equal(manager.address)

      await funding(manager.address)
      const newManager = ethers.Wallet.createRandom()
      await operatorManager.connect(manager).transferManager(newManager.address)
      expect(await operatorManager.manager()).to.equal(newManager.address)
    })
  })

  describe('Testing for Claiming', () => {
    let manager: HDNodeWallet

    const snapshot = async () => {
      manager = ethers.Wallet.createRandom()
      await operatorManager.transferManager(manager.address)
      await funding(operatorManager.target)
      return manager
    }

    beforeEach(async () => {
      manager = await loadFixture(snapshot)
    })

    describe('Testing for Claiming ERC20', () => {
      it('should fail when non-owner tries to claim ERC20', async () => {
        await expect(
          operatorManager.connect(ethers.Wallet.createRandom(ethers.provider)).claimERC20(ethers.ZeroAddress, 100)
        ).to.be.revertedWith('not onlyOwnerOrManager')
      })

      it('should fail when manager tries to claim ERC20 with insufficient balance', async () => {
        await expect(
          operatorManager.claimERC20(ethers.ZeroAddress, ethers.parseEther('101'))
        ).to.be.revertedWithCustomError(operatorManager, 'InsufficientBalanceError')
      })

      it("should increase manager's ETH balance by the contract's ETH balance after calling claimERC20 with zero address", async () => {
        await operatorManager.claimERC20(ethers.ZeroAddress, ethers.parseEther('100'))
        expect(await ethers.provider.getBalance(manager.address)).to.equal(ethers.parseEther('100'))
      })
    })

    describe('Testing for Claiming ETH', () => {
      it('should fail when non-owner tries to claim ETH', async () => {
        await expect(
          operatorManager.connect(ethers.Wallet.createRandom(ethers.provider)).claimETH()
        ).to.be.revertedWith('not onlyOwnerOrManager')
      })

      it("should increase manager's ETH balance by the contract's ETH balance after calling claimETH", async () => {
        await operatorManager.claimETH()
        expect(await ethers.provider.getBalance(manager.address)).to.equal(ethers.parseEther('100'))
      })
    })
  })

  describe('Testing for Acquiring Manager', () => {
    let rollupConfig: RollupConfig

    const snapshot = async () => {
      return ethers.deployContract('RollupConfig')
    }

    beforeEach(async () => {
      rollupConfig = await loadFixture(snapshot)
    })

    it('should fail acquireManager when not unsafeBlockSigner', async () => {
      await rollupConfig.setUnsafeBlockSigner(ethers.Wallet.createRandom().address)

      await network.provider.send('hardhat_setStorageAt', [
        operatorManager.target,
        '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
        `0x000000000000000000000000${rollupConfig.target.toString().slice(2).toLowerCase()}`
      ])

      await expect(operatorManager.acquireManager()).to.be.revertedWith("not config's seigniorageReceiver")
    })

    it('should change manager after calling acquireManager from unsafeBlockSigner', async () => {
      const unsafeBlockSigner = ethers.Wallet.createRandom(ethers.provider)
      await rollupConfig.setUnsafeBlockSigner(unsafeBlockSigner.address)

      await network.provider.send('hardhat_setStorageAt', [
        operatorManager.target,
        '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
        `0x000000000000000000000000${rollupConfig.target.toString().slice(2).toLowerCase()}`
      ])

      await funding(unsafeBlockSigner.address)
      await operatorManager.connect(unsafeBlockSigner).acquireManager()
      expect(await operatorManager.manager()).to.be.equal(unsafeBlockSigner.address)
    })
  })

  // requestWithdrawal
  // processRequest
  // processRequests
})

import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture, mine, setBalance, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { OperatorManagerV1_1 } from '../typechain-types'
import { getRandomAddresses } from '../utils'

describe('OperatorManagerV1_1 Test', () => {
  let owner: HardhatEthersSigner
  let manager: HardhatEthersSigner
  let newManager: HardhatEthersSigner
  let nonOwner: HardhatEthersSigner
  let unsafeBlockSigner: HardhatEthersSigner
  let operatorManager: OperatorManagerV1_1

  const deployOperatorManager = async () => {
    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await operatorManager.transferManager(manager.address)
    return { operatorManager }
  }

  const initializeOperatorManager = async () => {
    const { operatorManager } = await loadFixture(deployOperatorManager)

    const rollupConfig = await ethers.deployContract('RollupConfig')
    await setStorageAt(
      operatorManager.target.toString(),
      '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
      `0x000000000000000000000000${rollupConfig.target.toString().slice(2).toLowerCase()}`
    )

    const [ton, wton, candidate] = getRandomAddresses(3)
    const layer2Manager = await ethers.deployContract('MockLayer2Manager')
    const depositManager = await ethers.deployContract('MockDepositManager')

    await layer2Manager.setCandidateAddOnOfOperator(operatorManager.target, candidate)
    await operatorManager.setAddresses(layer2Manager, depositManager, ton, wton)
    await depositManager.deposit(candidate, 100)

    return { operatorManager, depositManager, candidate, rollupConfig }
  }

  beforeEach(async () => {
    ;[owner, manager, newManager, nonOwner, unsafeBlockSigner] = await ethers.getSigners()
    ;({ operatorManager } = await loadFixture(deployOperatorManager))
  })

  describe('Test for constructor', () => {
    it('should assign the deployer as the owner', async () => {
      const [owner] = await ethers.getSigners()
      expect(await operatorManager.owner()).to.equal(owner.address)
    })
  })

  describe('Testing for setAddresses', () => {
    it('should fail when non-owner tries to setAddresses', async () => {
      const [, nonOwner] = await ethers.getSigners()
      const [layer2Manager, ton, wton, depositManager] = getRandomAddresses(4)
      await expect(
        operatorManager.connect(nonOwner).setAddresses(layer2Manager, depositManager, ton, wton)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should fail when tries to setAddresses twice', async () => {
      const [layer2Manager, ton, wton, depositManager] = getRandomAddresses(4)
      await operatorManager.setAddresses(layer2Manager, depositManager, ton, wton)
      await expect(
        operatorManager.setAddresses(layer2Manager, depositManager, ton, wton)
      ).to.be.revertedWithCustomError(operatorManager, 'AlreadySetError')
    })

    it('should fail when depositManager is zero address', async () => {
      const [layer2Manager, ton, wton] = getRandomAddresses(3)
      await expect(operatorManager.setAddresses(layer2Manager, ethers.ZeroAddress, ton, wton)).to.be.revertedWith(
        'zero address'
      )
    })

    it('should fail when set _ton to the zero address', async () => {
      const [layer2Manager, depositManager, wton] = getRandomAddresses(3)
      await expect(
        operatorManager.setAddresses(layer2Manager, depositManager, ethers.ZeroAddress, wton)
      ).to.be.revertedWith('zero address')
    })

    it('should fail when set _wton to the zero address', async () => {
      const [layer2Manager, depositManager, ton] = getRandomAddresses(3)
      await expect(
        operatorManager.setAddresses(layer2Manager, depositManager, ton, ethers.ZeroAddress)
      ).to.be.revertedWith('zero address')
    })

    it('should fail when set _layer2Manager to the zero address', async () => {
      const [depositManager, ton, wton] = getRandomAddresses(3)
      await expect(operatorManager.setAddresses(ethers.ZeroAddress, depositManager, ton, wton)).to.be.revertedWith(
        'zero address'
      )
    })

    it('setAddresses', async () => {
      const [layer2Manager, depositManager, ton, wton] = getRandomAddresses(4)
      await operatorManager.setAddresses(layer2Manager, depositManager, ton, wton)

      expect(
        await ethers.provider.getStorage(
          operatorManager.target,
          '0x1e5e236e704b4589753ab620fd23d3321a80f8eee20526988a54214ac5af8eed'
        )
      ).to.equal(`0x000000000000000000000000${layer2Manager.slice(2).toLowerCase()}`)

      expect(
        await ethers.provider.getStorage(
          operatorManager.target,
          '0x6ab12bb59b8ea07c1cc11427fce17c9e354c419041651472a04b9843d34380a9'
        )
      ).to.equal(`0x000000000000000000000000${depositManager.slice(2).toLowerCase()}`)

      expect(
        await ethers.provider.getStorage(
          operatorManager.target,
          '0x5fa7357c3468b094bc9c15b746af6189f046af1501ae9751f49e7b4dd5616e97'
        )
      ).to.equal(`0x000000000000000000000000${wton.slice(2).toLowerCase()}`)

      expect(
        await ethers.provider.getStorage(
          operatorManager.target,
          '0x88940a795d305b6429c31402afcae61ef7d829b8a9fe2a9861b8c30cd60e80ec'
        )
      ).to.equal(`0x000000000000000000000000${ton.slice(2).toLowerCase()}`)
    })
  })

  describe('Testing for transferManager', () => {
    it('should fail when newManager is the same as current manager', async () => {
      const [owner] = await ethers.getSigners()
      await operatorManager.transferManager(owner.address)
      await expect(operatorManager.transferManager(owner.address)).to.be.revertedWithCustomError(
        operatorManager,
        'SameAddressError'
      )
    })

    it('should fail when newManager is zero address', async () => {
      await expect(operatorManager.transferManager(ethers.ZeroAddress)).to.be.revertedWith('zero address')
    })

    it('should fail when non-owner tries to transferManager', async () => {
      await expect(operatorManager.connect(nonOwner).transferManager(nonOwner.address)).to.be.revertedWith(
        'not onlyOwnerOrManager'
      )
    })

    it('transferManager by owner', async () => {
      await operatorManager.transferManager(newManager.address)
      expect(await operatorManager.manager()).to.equal(newManager.address)

      await operatorManager.connect(newManager).transferManager(owner.address)
      expect(await operatorManager.manager()).to.equal(owner.address)
    })
  })

  describe('Testing for claimETH', () => {
    it('should fail when non-owner tries to claim ETH', async () => {
      await expect(operatorManager.connect(ethers.Wallet.createRandom(ethers.provider)).claimETH()).to.be.revertedWith(
        'not onlyOwnerOrManager'
      )
    })

    it('should fail when transfer ETH failed', async () => {
      const receiver = await ethers.deployContract('MockReceiver')
      await setStorageAt(
        operatorManager.target.toString(),
        '0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02b',
        ethers.zeroPadValue(receiver.target.toString(), 32)
      )
      await expect(operatorManager.claimETH()).to.be.revertedWithCustomError(operatorManager, 'TransferEthError')
    })

    it('claimETH by owner', async () => {
      const balance = await ethers.provider.getBalance(manager)
      await setBalance(operatorManager.target.toString(), ethers.parseEther('100'))
      await operatorManager.claimETH()
      expect(await ethers.provider.getBalance(manager.address)).to.equal(balance + ethers.parseEther('100'))
    })

    it('claimETH by manager', async () => {
      const balance = await ethers.provider.getBalance(manager)
      await setBalance(operatorManager.target.toString(), ethers.parseEther('100'))
      const receipt = await (await operatorManager.connect(manager).claimETH()).wait()
      expect(await ethers.provider.getBalance(manager.address)).to.equal(
        balance + ethers.parseEther('100') - receipt!.gasUsed * receipt!.gasPrice
      )
    })
  })

  describe('Testing for claimERC20', () => {
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

    it('should fail when manager tries to claim ERC20 with insufficient balance', async () => {
      const mockERC20 = await ethers.deployContract('MockERC20')
      await mockERC20.mint(operatorManager.target, ethers.parseEther('100'))
      await expect(operatorManager.claimERC20(mockERC20, ethers.parseEther('101'))).to.be.revertedWithCustomError(
        operatorManager,
        'InsufficientBalanceError'
      )
    })

    it('claimERC20 with zero address by owner', async () => {
      const balance = await ethers.provider.getBalance(manager)
      await setBalance(operatorManager.target.toString(), ethers.parseEther('100'))
      await operatorManager.claimERC20(ethers.ZeroAddress, ethers.parseEther('100'))
      expect(await ethers.provider.getBalance(manager.address)).to.equal(balance + ethers.parseEther('100'))
    })

    it('claimERC20 with zero address by manager', async () => {
      const balance = await ethers.provider.getBalance(manager)
      await setBalance(operatorManager.target.toString(), ethers.parseEther('100'))
      const receipt = await (
        await operatorManager.connect(manager).claimERC20(ethers.ZeroAddress, ethers.parseEther('100'))
      ).wait()
      expect(await ethers.provider.getBalance(manager.address)).to.equal(
        balance + ethers.parseEther('100') - receipt!.gasUsed * receipt!.gasPrice
      )
    })

    it('claimERC20 by owner', async () => {
      const mockERC20 = await ethers.deployContract('MockERC20')
      await mockERC20.mint(operatorManager.target, ethers.parseEther('100'))
      await operatorManager.claimERC20(mockERC20, ethers.parseEther('100'))
      expect(await mockERC20.balanceOf(manager.address)).to.equal(ethers.parseEther('100'))
    })

    it('claimERC20 by manager', async () => {
      const mockERC20 = await ethers.deployContract('MockERC20')
      await mockERC20.mint(operatorManager.target, ethers.parseEther('100'))
      await operatorManager.connect(manager).claimERC20(mockERC20, ethers.parseEther('100'))
      expect(await mockERC20.balanceOf(manager.address)).to.equal(ethers.parseEther('100'))
    })
  })

  describe('Testing for requestWithdrawal', () => {
    it('should fail when non-owner tries to requestWithdrawal', async () => {
      await expect(operatorManager.connect(nonOwner).requestWithdrawal(100)).to.be.revertedWith(
        'not onlyOwnerOrManager'
      )
    })

    it('requestWithdrawal by owner', async () => {
      const [ton, wton, candidate] = getRandomAddresses(3)
      const layer2Manager = await ethers.deployContract('MockLayer2Manager')
      const depositManager = await ethers.deployContract('MockDepositManager')

      await layer2Manager.setCandidateAddOnOfOperator(operatorManager.target, candidate)
      await operatorManager.setAddresses(layer2Manager, depositManager, ton, wton)
      await depositManager.deposit(candidate, 100)

      const receipt = await (await operatorManager.requestWithdrawal(100)).wait()
      const requestWithdrawalSignature = ethers.id('WithdrawalRequested(address,address,uint256)')
      const requestWithdrawalEvent = receipt!.logs.find((log) => log.topics[0] === requestWithdrawalSignature)
      expect(requestWithdrawalEvent).to.not.be.undefined

      const parsedRequestWithdrawalEvent = depositManager.interface.parseLog(requestWithdrawalEvent!)
      expect(parsedRequestWithdrawalEvent?.args[0]).to.equal(candidate)
      expect(parsedRequestWithdrawalEvent?.args[1]).to.equal(operatorManager.target)
      expect(parsedRequestWithdrawalEvent?.args[2]).to.equal(100)
    })

    it('requestWithdrawal by manager', async () => {
      const [ton, wton, candidate] = getRandomAddresses(3)
      const layer2Manager = await ethers.deployContract('MockLayer2Manager')
      const depositManager = await ethers.deployContract('MockDepositManager')

      await layer2Manager.setCandidateAddOnOfOperator(operatorManager.target, candidate)
      await operatorManager.setAddresses(layer2Manager, depositManager, ton, wton)
      await depositManager.deposit(candidate, 100)

      const receipt = await (await operatorManager.connect(manager).requestWithdrawal(100)).wait()
      const requestWithdrawalSignature = ethers.id('WithdrawalRequested(address,address,uint256)')
      const requestWithdrawalEvent = receipt!.logs.find((log) => log.topics[0] === requestWithdrawalSignature)
      expect(requestWithdrawalEvent).to.not.be.undefined

      const parsedRequestWithdrawalEvent = depositManager.interface.parseLog(requestWithdrawalEvent!)
      expect(parsedRequestWithdrawalEvent?.args[0]).to.equal(candidate)
      expect(parsedRequestWithdrawalEvent?.args[1]).to.equal(operatorManager.target)
      expect(parsedRequestWithdrawalEvent?.args[2]).to.equal(100)
    })
  })

  describe('Testing for processRequest', () => {
    it('should fail when non-owner tries to processRequest', async () => {
      await expect(operatorManager.connect(nonOwner).processRequest()).to.be.revertedWith('not onlyOwnerOrManager')
    })

    it('processRequest by owner', async () => {
      const { operatorManager, depositManager, candidate } = await loadFixture(initializeOperatorManager)

      const receipt = await (await operatorManager.requestWithdrawal(100)).wait()
      const requestWithdrawalSignature = ethers.id('WithdrawalRequested(address,address,uint256)')
      const requestWithdrawalEvent = receipt!.logs.find((log) => log.topics[0] === requestWithdrawalSignature)
      expect(requestWithdrawalEvent).to.not.be.undefined

      await mine(await depositManager.getDelayBlocks(candidate))

      await operatorManager.processRequest()
    })

    it('processRequest by manager', async () => {
      const { operatorManager, depositManager, candidate } = await loadFixture(initializeOperatorManager)

      const receipt = await (await operatorManager.requestWithdrawal(100)).wait()
      const requestWithdrawalSignature = ethers.id('WithdrawalRequested(address,address,uint256)')
      const requestWithdrawalEvent = receipt!.logs.find((log) => log.topics[0] === requestWithdrawalSignature)
      expect(requestWithdrawalEvent).to.not.be.undefined

      await mine(await depositManager.getDelayBlocks(candidate))

      await operatorManager.connect(manager).processRequest()
    })
  })

  describe('Testing for processRequests', () => {
    it('should fail when non-owner tries to processRequests', async () => {
      await expect(operatorManager.connect(nonOwner).processRequests(1)).to.be.revertedWith('not onlyOwnerOrManager')
    })

    it('processRequests by owner', async () => {
      const { operatorManager, depositManager, candidate } = await loadFixture(initializeOperatorManager)

      const receipt = await (await operatorManager.requestWithdrawal(100)).wait()
      const requestWithdrawalSignature = ethers.id('WithdrawalRequested(address,address,uint256)')
      const requestWithdrawalEvent = receipt!.logs.find((log) => log.topics[0] === requestWithdrawalSignature)
      expect(requestWithdrawalEvent).to.not.be.undefined

      await mine(await depositManager.getDelayBlocks(candidate))

      await operatorManager.processRequests(1)
    })

    it('processRequests by manager', async () => {
      const { operatorManager, depositManager, candidate } = await loadFixture(initializeOperatorManager)

      const receipt = await (await operatorManager.requestWithdrawal(100)).wait()
      const requestWithdrawalSignature = ethers.id('WithdrawalRequested(address,address,uint256)')
      const requestWithdrawalEvent = receipt!.logs.find((log) => log.topics[0] === requestWithdrawalSignature)
      expect(requestWithdrawalEvent).to.not.be.undefined

      await mine(await depositManager.getDelayBlocks(candidate))

      await operatorManager.connect(manager).processRequests(1)
    })
  })

  describe('Testing for Acquiring Manager', () => {
    it('should fail when already manager', async () => {
      const { operatorManager } = await loadFixture(initializeOperatorManager)
      await expect(operatorManager.connect(manager).acquireManager()).to.be.revertedWith('already manager')
    })

    it('should fail acquireManager when not unsafeBlockSigner', async () => {
      const { operatorManager } = await loadFixture(initializeOperatorManager)
      await expect(operatorManager.acquireManager()).to.be.revertedWith("not config's seigniorageReceiver")
    })

    it('should change manager after calling acquireManager from unsafeBlockSigner', async () => {
      const { operatorManager, rollupConfig } = await loadFixture(initializeOperatorManager)
      await rollupConfig.setUnsafeBlockSigner(unsafeBlockSigner)
      await operatorManager.connect(unsafeBlockSigner).acquireManager()
      expect(await operatorManager.manager()).to.be.equal(unsafeBlockSigner.address)
    })
  })

  describe('Testing for view methods', () => {
    it('isOperator', async () => {
      const { operatorManager } = await loadFixture(initializeOperatorManager)
      expect(await operatorManager.isOperator(manager.address)).to.equal(true)
    })

    it('checkBridge', async () => {})

    it('operator', async () => {
      const { operatorManager } = await loadFixture(initializeOperatorManager)
      expect(await operatorManager.operator()).to.equal(manager.address)
    })
  })
})

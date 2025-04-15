import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'

import { ethers, getNamedAccounts, network } from 'hardhat'
import type { OperatorManagerFactory, OperatorManagerV1_1 } from '../typechain-types'
import { funding, impersonate } from '../utils'

describe('OperatorManagerFactory', () => {
  let DEPOSIT_MANAGER: string
  let LAYER2_MANAGER: string
  let TON: string
  let WTON: string

  let operatorManagerFactory: OperatorManagerFactory
  let operatorManagerImpl: OperatorManagerV1_1

  const deploy = async () => {
    const operatorManagerImpl = await ethers.deployContract('OperatorManagerV1_1')
    const operatorManagerFactory = await ethers.deployContract('OperatorManagerFactory', [operatorManagerImpl.target])
    expect(await operatorManagerFactory.operatorManagerImp()).to.equal(operatorManagerImpl.target)
    return { operatorManagerFactory, operatorManagerImpl }
  }

  beforeEach(async () => {
    ;({ operatorManagerFactory, operatorManagerImpl } = await loadFixture(deploy))
    ;({ DEPOSIT_MANAGER, LAYER2_MANAGER, TON, WTON } = await getNamedAccounts())
  })

  describe('Tests for Contract Deployment', () => {
    it('should fail when deploy OperatorManagerFactory with zero address', async () => {
      await expect(ethers.deployContract('OperatorManagerFactory', [ethers.ZeroAddress])).to.be.revertedWith(
        'zero operatorManagerImp'
      )
    })

    it('should set operatorManagerImp', async () => {
      const operatorManagerImpl = await ethers.deployContract('OperatorManagerV1_1')
      const operatorManagerFactory = await ethers.deployContract('OperatorManagerFactory', [operatorManagerImpl.target])
      expect(await operatorManagerFactory.operatorManagerImp()).to.equal(operatorManagerImpl.target)
    })
  })

  describe('Testing for Changes Operator Manager Implementation', () => {
    it('should fail when non-owner tries to set changeOperatorManagerImp', async () => {
      const [, nonOwner] = await ethers.getSigners()
      await expect(
        operatorManagerFactory.connect(nonOwner).changeOperatorManagerImp(ethers.ZeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should fail when change operatorManagerImp to the same address', async () => {
      await expect(
        operatorManagerFactory.changeOperatorManagerImp(operatorManagerImpl.target)
      ).to.be.revertedWithCustomError(operatorManagerFactory, 'SameVariableError')
    })

    it('should fail when change operatorManagerImp to the zero address', async () => {
      await expect(operatorManagerFactory.changeOperatorManagerImp(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        operatorManagerFactory,
        'ZeroAddressError'
      )
    })

    it('should change operatorManagerImp to new operatorManagerImp', async () => {
      const newOperatorManagerImpl = await ethers.deployContract('OperatorManagerV1_1')
      await operatorManagerFactory.changeOperatorManagerImp(newOperatorManagerImpl.target)
      expect(await operatorManagerFactory.operatorManagerImp()).to.equal(newOperatorManagerImpl.target)
    })
  })

  describe('Testing for Addresses Setup', () => {
    it('should fail when non-owner tries to set addresses', async () => {
      const [, nonOwner] = await ethers.getSigners()
      await expect(
        operatorManagerFactory.connect(nonOwner).setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should fail when set _depositManager to the zero address', async () => {
      await expect(
        operatorManagerFactory.setAddresses(ethers.ZeroAddress, LAYER2_MANAGER, TON, WTON)
      ).to.be.revertedWith('zero _depositManager')
    })

    it('should fail when set _ton to the zero address', async () => {
      await expect(
        operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, ethers.ZeroAddress, WTON, LAYER2_MANAGER)
      ).to.be.revertedWith('zero _ton')
    })

    it('should fail when set _wton to the zero address', async () => {
      await expect(
        operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, ethers.ZeroAddress, LAYER2_MANAGER)
      ).to.be.revertedWith('zero _wton')
    })

    it('should fail when set _layer2Manager to the zero address', async () => {
      await expect(
        operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, ethers.ZeroAddress)
      ).to.be.revertedWith('zero _layer2Manager')
    })

    it('should fail when the addresses are already set', async () => {
      await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)
      await expect(
        operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)
      ).to.be.revertedWithCustomError(operatorManagerFactory, 'AlreadySetError')
    })

    it('should set addresses correctly', async () => {
      await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)
      expect(await operatorManagerFactory.depositManager()).to.equal(DEPOSIT_MANAGER)
      expect(await operatorManagerFactory.ton()).to.equal(TON)
      expect(await operatorManagerFactory.wton()).to.equal(WTON)
      expect(await operatorManagerFactory.layer2Manager()).to.equal(LAYER2_MANAGER)
    })
  })

  describe('Testing for Create Operator Manager', () => {
    it('should fail when create OperatorManager with non-layer2Manager', async () => {
      await expect(operatorManagerFactory.createOperatorManager(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(operatorManagerFactory, 'CreateError')
        .withArgs(1)
    })

    it('should failed when create OperatorManager with RollupConfig(address(0))', async () => {
      await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)

      const layer2ManagerSigner = await impersonate(LAYER2_MANAGER)
      await funding(LAYER2_MANAGER)

      await expect(operatorManagerFactory.connect(layer2ManagerSigner).createOperatorManager(ethers.ZeroAddress)).to.be
        .reverted
    })

    it('should failed when create OperatorManager with unsafeBlockSigner(address(0))', async () => {
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)

      const layer2ManagerSigner = await impersonate(LAYER2_MANAGER)
      await funding(LAYER2_MANAGER)

      await expect(operatorManagerFactory.connect(layer2ManagerSigner).createOperatorManager(rollupConfig.target))
        .to.be.revertedWithCustomError(operatorManagerFactory, 'CreateError')
        .withArgs(2)
    })

    it('should failed when create OperatorManager twice for the same rollupConfig', async () => {
      const sManager = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setUnsafeBlockSigner(sManager)

      await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)

      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [LAYER2_MANAGER]
      })
      await funding(LAYER2_MANAGER)
      const layer2ManagerSigner = await ethers.getSigner(LAYER2_MANAGER)

      await operatorManagerFactory.connect(layer2ManagerSigner).createOperatorManager(rollupConfig.target)
      await expect(
        operatorManagerFactory.connect(layer2ManagerSigner).createOperatorManager(rollupConfig.target)
      ).to.be.revertedWith('already created')
    })

    it("should match the result of the getAddress() method and the CreatedOperatorManager event's operatorManager(4th)", async () => {
      const [owner] = await ethers.getSigners()
      const sManager = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setUnsafeBlockSigner(sManager)

      await operatorManagerFactory.setAddresses(DEPOSIT_MANAGER, TON, WTON, LAYER2_MANAGER)

      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [LAYER2_MANAGER]
      })

      await funding(LAYER2_MANAGER)
      const layer2ManagerSigner = await ethers.getSigner(LAYER2_MANAGER)
      // workaround for ethers.js v6, we can't call contract's getAddress() method directly
      // because it's added as a property to the contract instance
      // https://docs.ethers.org/v6/api/contract/#BaseContract-getAddress
      const operatorManagerAddress = await (operatorManagerFactory as Record<string, any>)['getAddress(address)'](
        rollupConfig.target
      )
      await expect(operatorManagerFactory.connect(layer2ManagerSigner).createOperatorManager(rollupConfig.target))
        .to.emit(operatorManagerFactory, 'CreatedOperatorManager')
        .withArgs(rollupConfig.target, owner.address, sManager, operatorManagerAddress)
    })
  })
})

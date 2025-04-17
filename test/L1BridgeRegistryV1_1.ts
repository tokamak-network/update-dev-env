import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers, getNamedAccounts } from 'hardhat'
import type { L1BridgeRegistryV1_1 } from '../typechain-types'

describe('L1BridgeRegistryV1_1(without Proxy Contract)', () => {
  let owner: HardhatEthersSigner
  let manager: HardhatEthersSigner
  let seigniorageCommittee: HardhatEthersSigner

  let l1BridgeRegistry: L1BridgeRegistryV1_1

  const deployL1BridgeRegistry = async () => {
    const [owner] = await ethers.getSigners()
    const l1BridgeRegistry = await ethers.deployContract('L1BridgeRegistryV1_1')
    const role = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const rolesStorageSlot = 5
    const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
    const outerSlot = ethers.keccak256(encodedOuter)
    const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [owner.address, BigInt(outerSlot)]
    )
    const memberSlot = ethers.keccak256(encodedMember)
    await setStorageAt(l1BridgeRegistry.target.toString(), memberSlot, ethers.zeroPadValue('0x01', 32))

    return l1BridgeRegistry
  }

  const deployL1BridgeRegistryAndRollupConfig = async () => {
    const l1BridgeRegistry = await deployL1BridgeRegistry()

    const l1StandardBridge = ethers.Wallet.createRandom().address
    const optimismPortal = ethers.Wallet.createRandom().address
    const rollupConfig = await ethers.deployContract('RollupConfig')
    await rollupConfig.setL11StandardBridge(l1StandardBridge)
    await rollupConfig.setOptimismPortal(optimismPortal)

    return { l1BridgeRegistry, rollupConfig }
  }

  const registerRollupConfig = async (type: number) => {
    const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()

    const [, manager] = await ethers.getSigners()
    await l1BridgeRegistry.addManager(manager.address)

    const l2ton = ethers.Wallet.createRandom().address
    await l1BridgeRegistry
      .connect(manager)
      ['registerRollupConfigByManager(address,uint8,address)'](rollupConfig, type, l2ton)

    return { l1BridgeRegistry, rollupConfig }
  }

  beforeEach(async () => {
    ;[owner, manager, seigniorageCommittee] = await ethers.getSigners()
    l1BridgeRegistry = await loadFixture(deployL1BridgeRegistry)
  })

  describe('Tests for Set Addresses', () => {
    it('should set addresses', async () => {
      const { LAYER2_MANAGER, SEIG_MANAGER, TON } = await getNamedAccounts()
      await expect(l1BridgeRegistry.setAddresses(LAYER2_MANAGER, SEIG_MANAGER, TON))
        .to.be.emit(l1BridgeRegistry, 'SetAddresses')
        .withArgs(LAYER2_MANAGER, SEIG_MANAGER, TON)

      expect(await l1BridgeRegistry.layer2Manager()).to.be.equal(LAYER2_MANAGER)
      expect(await l1BridgeRegistry.seigManager()).to.be.equal(SEIG_MANAGER)
      expect(await l1BridgeRegistry.ton()).to.be.equal(TON)
    })

    it('should fail when trying to set addresses with zero address(ton)', async () => {
      const { SEIG_MANAGER, TON } = await getNamedAccounts()
      await expect(l1BridgeRegistry.setAddresses(ethers.ZeroAddress, SEIG_MANAGER, TON)).to.be.revertedWithCustomError(
        l1BridgeRegistry,
        'ZeroAddressError'
      )
    })

    it('should fail when trying to set addresses with zero address(seigManager)', async () => {
      const { LAYER2_MANAGER, TON } = await getNamedAccounts()
      await expect(
        l1BridgeRegistry.setAddresses(LAYER2_MANAGER, ethers.ZeroAddress, TON)
      ).to.be.revertedWithCustomError(l1BridgeRegistry, 'ZeroAddressError')
    })

    it('should fail when trying to set addresses with zero address(layer2Manager)', async () => {
      const { SEIG_MANAGER, TON } = await getNamedAccounts()
      await expect(l1BridgeRegistry.setAddresses(ethers.ZeroAddress, SEIG_MANAGER, TON)).to.be.revertedWithCustomError(
        l1BridgeRegistry,
        'ZeroAddressError'
      )
    })

    it('should fail when owner tries to set addresses twice', async () => {
      const { LAYER2_MANAGER, SEIG_MANAGER, TON } = await getNamedAccounts()
      await l1BridgeRegistry.setAddresses(LAYER2_MANAGER, SEIG_MANAGER, TON)

      await expect(l1BridgeRegistry.setAddresses(LAYER2_MANAGER, SEIG_MANAGER, TON)).to.be.revertedWith(
        'already initialized'
      )
    })

    it('should fail when non-owner tries to set addresses', async () => {
      const [, nonOwner] = await ethers.getSigners()
      const { LAYER2_MANAGER, SEIG_MANAGER, TON } = await getNamedAccounts()
      await expect(
        l1BridgeRegistry.connect(nonOwner).setAddresses(LAYER2_MANAGER, SEIG_MANAGER, TON)
      ).to.be.revertedWith('AuthControl: Caller is not an admin')
    })
  })

  describe('Tests for Set Seigniorage Committee', () => {
    it('should set seigniorage committee', async () => {
      const seigniorageCommittee = ethers.Wallet.createRandom().address
      await expect(l1BridgeRegistry.setSeigniorageCommittee(seigniorageCommittee))
        .to.be.emit(l1BridgeRegistry, 'SetSeigniorageCommittee')
        .withArgs(seigniorageCommittee)
      expect(await l1BridgeRegistry.seigniorageCommittee()).to.be.equal(seigniorageCommittee)
    })

    it('should fail when non-owner tries to set seigniorage committee', async () => {
      const [, nonOwner] = await ethers.getSigners()
      const seigniorageCommittee = ethers.Wallet.createRandom().address
      await expect(l1BridgeRegistry.connect(nonOwner).setSeigniorageCommittee(seigniorageCommittee)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when owner tries to set seigniorage committee to the same address', async () => {
      const seigniorageCommittee = ethers.Wallet.createRandom().address
      await l1BridgeRegistry.setSeigniorageCommittee(seigniorageCommittee)
      await expect(l1BridgeRegistry.setSeigniorageCommittee(seigniorageCommittee)).to.be.revertedWith('same')
    })
  })

  describe('Tests for Register Rollup Config with Name By Manager', () => {
    let owner: HardhatEthersSigner
    let manager: HardhatEthersSigner

    beforeEach(async () => {
      ;[owner, manager] = await ethers.getSigners()
    })

    it('should fail when non-manager tries to register rollup config', async () => {
      const rollupConfig = ethers.Wallet.createRandom().address
      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')
      ).to.be.revertedWith('AuthControl: Caller is not a manager')
    })

    it('should fail registering rollup config when l2ton is zero address', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      await expect(
        l1BridgeRegistry
          .connect(manager)
          ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 1, ethers.ZeroAddress, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(4)
    })

    it('should fail registering rollup config with invalid type(0, 3)', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry
          .connect(manager)
          ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 0, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(1)

      await expect(
        l1BridgeRegistry
          .connect(manager)
          ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 3, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(1)
    })

    it('should fail registering rollup config twice', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(manager)
        ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')

      await expect(
        l1BridgeRegistry
          .connect(manager)
          ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(2)
    })

    it('should fail registering rollup config when optimismPortal is not set', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)
      await rollupConfig.setOptimismPortal(ethers.ZeroAddress)

      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry
          .connect(manager)
          ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 2, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(3)
    })

    it('should fail registering rollup config when l1StandardBridge is not set', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)
      await rollupConfig.setL11StandardBridge(ethers.ZeroAddress)

      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry
          .connect(manager)
          ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 2, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(3)
    })

    it('should register rollup config(type = 1)', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(manager)
        ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')
    })

    it('should register rollup config(type = 2)', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(manager)
        ['registerRollupConfigByManager(address,uint8,address,string)'](rollupConfig, 2, l2ton, 'test')
    })
  })

  describe('Tests for Register Rollup Config without Name By Manager', () => {
    it('should register rollup config(type = 1)', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(manager)
        ['registerRollupConfigByManager(address,uint8,address)'](rollupConfig, 1, l2ton)
    })

    it('should register rollup config(type = 2)', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await l1BridgeRegistry.addManager(manager.address)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(manager)
        ['registerRollupConfigByManager(address,uint8,address)'](rollupConfig, 2, l2ton)
    })
  })

  describe('Tests for Register Rollup Config with Name By Registrant', () => {
    let owner: HardhatEthersSigner
    let manager: HardhatEthersSigner
    let registrant: HardhatEthersSigner

    const setRegistrant = async () => {
      const [owner, manager, registrant] = await ethers.getSigners()
      await l1BridgeRegistry.addManager(manager.address)
      await l1BridgeRegistry.connect(manager).addRegistrant(registrant.address)

      return { owner, manager, registrant }
    }

    beforeEach(async () => {
      ;({ owner, manager, registrant } = await loadFixture(setRegistrant))
    })

    it('should fail when non-registrant tries to register rollup config', async () => {
      const rollupConfig = ethers.Wallet.createRandom().address
      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')
      ).to.be.revertedWith('AuthControl: Caller is not a registrant')
    })

    it('should fail registering rollup config when l2ton is zero address', async () => {
      const l1StandardBridge = ethers.Wallet.createRandom().address
      const optimismPortal = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL11StandardBridge(l1StandardBridge)
      await rollupConfig.setOptimismPortal(optimismPortal)

      await expect(
        l1BridgeRegistry
          .connect(registrant)
          ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 1, ethers.ZeroAddress, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(4)
    })

    it('should fail registering rollup config with invalid type(0, 3)', async () => {
      const l1StandardBridge = ethers.Wallet.createRandom().address
      const optimismPortal = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL11StandardBridge(l1StandardBridge)
      await rollupConfig.setOptimismPortal(optimismPortal)
      const l2ton = ethers.Wallet.createRandom().address

      await expect(
        l1BridgeRegistry
          .connect(registrant)
          ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 0, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(1)

      await expect(
        l1BridgeRegistry
          .connect(registrant)
          ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 3, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(1)
    })

    it('should fail registering rollup config twice', async () => {
      const l1StandardBridge = ethers.Wallet.createRandom().address
      const optimismPortal = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL11StandardBridge(l1StandardBridge)
      await rollupConfig.setOptimismPortal(optimismPortal)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(registrant)
        ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')

      await expect(
        l1BridgeRegistry
          .connect(registrant)
          ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(2)
    })

    it('should fail registering rollup config when optimismPortal is not set', async () => {
      const l1StandardBridge = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL11StandardBridge(l1StandardBridge)

      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry
          .connect(registrant)
          ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 2, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(3)
    })

    it('should fail registering rollup config when l1StandardBridge is not set', async () => {
      const optimismPortal = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setOptimismPortal(optimismPortal)

      const l2ton = ethers.Wallet.createRandom().address
      await expect(
        l1BridgeRegistry
          .connect(registrant)
          ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 2, l2ton, 'test')
      )
        .to.be.revertedWithCustomError(l1BridgeRegistry, 'RegisterError')
        .withArgs(3)
    })

    it('should register rollup config(type = 1)', async () => {
      const l1StandardBridge = ethers.Wallet.createRandom().address
      const optimismPortal = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL11StandardBridge(l1StandardBridge)
      await rollupConfig.setOptimismPortal(optimismPortal)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(registrant)
        ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 1, l2ton, 'test')
    })

    it('should register rollup config(type = 2)', async () => {
      const l1StandardBridge = ethers.Wallet.createRandom().address
      const optimismPortal = ethers.Wallet.createRandom().address
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL11StandardBridge(l1StandardBridge)
      await rollupConfig.setOptimismPortal(optimismPortal)

      const l2ton = ethers.Wallet.createRandom().address
      await l1BridgeRegistry
        .connect(registrant)
        ['registerRollupConfig(address,uint8,address,string)'](rollupConfig, 2, l2ton, 'test')
    })
  })

  describe('Tests for Reject Rollup Config', () => {
    it('should fail when non-seigniorage committee tries to reject rollup config', async () => {
      await expect(l1BridgeRegistry.rejectCandidateAddOn(ethers.Wallet.createRandom().address)).to.be.revertedWith(
        'PermissionError'
      )
    })

    it('should fail when trying to reject non-registered rollup config', async () => {
      await l1BridgeRegistry.setSeigniorageCommittee(seigniorageCommittee.address)
      await expect(
        l1BridgeRegistry.connect(seigniorageCommittee).rejectCandidateAddOn(ethers.Wallet.createRandom().address)
      ).to.be.revertedWith('NonRegistered')
    })

    // it('should reject rollup config', async () => {
    //   await l1BridgeRegistry.addManager(manager.address)
    //   await l1BridgeRegistry.setSeigniorageCommittee(seigniorageCommittee.address)

    //   const l1StandardBridge = ethers.Wallet.createRandom().address
    //   const optimismPortal = ethers.Wallet.createRandom().address
    //   const rollupConfig = await ethers.deployContract('RollupConfig')
    //   await rollupConfig.setL11StandardBridge(l1StandardBridge)
    //   await rollupConfig.setOptimismPortal(optimismPortal)

    //   const l2ton = ethers.Wallet.createRandom().address
    //   await l1BridgeRegistry
    //     .connect(manager)
    //     ['registerRollupConfigByManager(address,uint8,address)'](rollupConfig, 2, l2ton)
    //   await l1BridgeRegistry.connect(seigniorageCommittee).rejectCandidateAddOn(rollupConfig)
    // })
  })

  describe('Tests for availableForRegistration', () => {
    it('should return false when rollup config has no l1StandardBridge', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await rollupConfig.setL11StandardBridge(ethers.ZeroAddress)
      expect(await l1BridgeRegistry.availableForRegistration(rollupConfig, 1)).to.be.equal(false)
    })

    it('should return false when rollup config has no optimismPortal', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      await rollupConfig.setOptimismPortal(ethers.ZeroAddress)
      expect(await l1BridgeRegistry.availableForRegistration(rollupConfig, 2)).to.be.equal(false)
    })

    it('should return false when rollup config is already registered', async () => {
      const { l1BridgeRegistry, rollupConfig } = await registerRollupConfig(2)
      expect(await l1BridgeRegistry.availableForRegistration(rollupConfig, 2)).to.be.equal(false)
    })

    it('should return true when rollup config is not registered', async () => {
      const { l1BridgeRegistry, rollupConfig } = await deployL1BridgeRegistryAndRollupConfig()
      expect(await l1BridgeRegistry.availableForRegistration(rollupConfig, 2)).to.be.equal(true)
    })
  })
})

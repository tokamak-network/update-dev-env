import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import type { Addressable } from 'ethers'
import { ethers, getNamedAccounts, network } from 'hardhat'
import type { L1BridgeRegistryV1_1 } from '../typechain-types'

describe('AuthControlL1BridgeRegistry(without Proxy Contract)', () => {
  let owner: HardhatEthersSigner
  let manager: HardhatEthersSigner
  let registrant: HardhatEthersSigner
  let nonOwner: HardhatEthersSigner
  let nonManager: HardhatEthersSigner
  let nonRegistrant: HardhatEthersSigner
  let newAdmin: HardhatEthersSigner
  let l1BridgeRegistry: L1BridgeRegistryV1_1
  const snapshot = async () => {
    l1BridgeRegistry = await ethers.deployContract('MockL1BridgeRegistryV1_1')

    l1BridgeRegistry.addManager(manager.address)
    l1BridgeRegistry.connect(manager).addRegistrant(registrant.address)

    return l1BridgeRegistry
  }

  beforeEach(async () => {
    ;[owner, manager, registrant, nonOwner, nonManager, nonRegistrant, newAdmin] = await ethers.getSigners()
    l1BridgeRegistry = await loadFixture(snapshot)
  })

  describe('Tests for Contract Deployment', () => {
    it('should set owner after deployment', async () => {
      expect(await l1BridgeRegistry.isAdmin(owner.address)).to.equal(true)
    })
  })

  describe('Tests for Role Management', () => {
    it('should fail when non-admin tries to add admin', async () => {
      await expect(l1BridgeRegistry.connect(nonOwner).addAdmin(nonOwner.address)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when non-admin tries to add manager', async () => {
      await expect(l1BridgeRegistry.connect(nonOwner).addManager(nonOwner.address)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when non-manager tries to add registrant', async () => {
      await expect(l1BridgeRegistry.connect(nonManager).addRegistrant(nonManager.address)).to.be.revertedWith(
        'AuthControl: Caller is not a manager'
      )
    })

    it('should fail when non-admin tries to renounce admin', async () => {
      await expect(l1BridgeRegistry.connect(nonOwner).renounceOwnership()).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when non-registrant tries to renounce registrant', async () => {
      await expect(l1BridgeRegistry.connect(nonRegistrant).renounceRegistrant()).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should fail when non-manager tries to renounce manager', async () => {
      await expect(l1BridgeRegistry.connect(nonManager).renounceManager()).to.be.revertedWith('already not granted')
    })

    it('should fail when non-owner tries to revoke manager', async () => {
      await expect(l1BridgeRegistry.connect(nonOwner).revokeManager(manager.address)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when non-owner tries to revoke registrant', async () => {
      await expect(l1BridgeRegistry.connect(nonOwner).revokeRegistrant(registrant.address)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when non-admin tries to transfer admin role', async () => {
      await expect(l1BridgeRegistry.connect(nonOwner).transferAdmin(newAdmin.address)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when transfer admin role to same address', async () => {
      await expect(l1BridgeRegistry.transferAdmin(owner.address)).to.be.revertedWith('Accessible: same admin')
    })

    it('should fail when transfer admin role to zero address', async () => {
      await expect(l1BridgeRegistry.transferAdmin(ethers.ZeroAddress)).to.be.revertedWith('Accessible: zero address')
    })

    it('should fail when transfer admin role to admin', async () => {
      await l1BridgeRegistry.addAdmin(newAdmin.address)
      await expect(l1BridgeRegistry.transferAdmin(newAdmin.address)).to.be.revertedWith('already granted')
    })

    it('should fail when add manager as a manager', async () => {
      await expect(l1BridgeRegistry.addManager(manager.address)).to.be.revertedWith('already granted')
    })

    it('should fail when add registrant as a registrant', async () => {
      await expect(l1BridgeRegistry.connect(manager).addRegistrant(registrant.address)).to.be.revertedWith(
        'already granted'
      )
    })

    it('should fail when tried to grant non-permissioned role', async () => {
      await expect(l1BridgeRegistry.connect(manager).grantRole(ethers.id('0x01'), nonOwner.address)).to.be.revertedWith(
        `AccessControl: account ${manager.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
      )
    })

    it('should fail when tried to revoke non-permissioned role', async () => {
      await l1BridgeRegistry.grantRole(ethers.id('0x01'), nonOwner.address)
      await expect(
        l1BridgeRegistry.connect(manager).revokeRole(ethers.id('0x01'), nonOwner.address)
      ).to.be.revertedWith(
        `AccessControl: account ${manager.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
      )
    })

    it('should fail when tried to renounce empty role', async () => {
      await expect(
        l1BridgeRegistry.connect(manager).renounceRole(ethers.id('0x01'), nonOwner.address)
      ).to.be.revertedWith('AccessControl: can only renounce roles for self')
    })

    it('should grant any role', async () => {
      await l1BridgeRegistry.grantRole(ethers.id('0x01'), registrant.address)
      expect(await l1BridgeRegistry.hasRole(ethers.id('0x01'), registrant.address)).to.equal(true)
    })

    it('should revoke any role', async () => {
      await l1BridgeRegistry.grantRole(ethers.id('0x01'), registrant.address)
      await l1BridgeRegistry.revokeRole(ethers.id('0x01'), registrant.address)
      expect(await l1BridgeRegistry.hasRole(ethers.id('0x01'), registrant.address)).to.equal(false)
    })

    it('should renounce admin role', async () => {
      await l1BridgeRegistry.renounceOwnership()
      expect(await l1BridgeRegistry.isAdmin(owner.address)).to.equal(false)
    })

    it('should set manager role', async () => {
      expect(await l1BridgeRegistry.isManager(manager.address)).to.equal(true)
    })

    it('should renounce manager role', async () => {
      await l1BridgeRegistry.connect(manager).renounceManager()
      expect(await l1BridgeRegistry.isManager(manager.address)).to.equal(false)
    })

    it('should set registrant role', async () => {
      expect(await l1BridgeRegistry.isRegistrant(registrant.address)).to.equal(true)
    })

    it('should renounce registrant role', async () => {
      await l1BridgeRegistry.connect(registrant).renounceRegistrant()
      expect(await l1BridgeRegistry.isRegistrant(registrant.address)).to.equal(false)
    })

    it('should revoke manager role from owner', async () => {
      await l1BridgeRegistry.revokeManager(manager.address)
      expect(await l1BridgeRegistry.isManager(manager.address)).to.equal(false)
    })

    it('should revoke registrant role from owner', async () => {
      await l1BridgeRegistry.revokeRegistrant(registrant.address)
      expect(await l1BridgeRegistry.isRegistrant(registrant.address)).to.equal(false)
    })

    it('should revoke registrant role from manager', async () => {
      await l1BridgeRegistry.revokeRole(ethers.id('REGISTRANT'), registrant.address)
      expect(await l1BridgeRegistry.isRegistrant(registrant.address)).to.equal(false)
    })

    it('should transfer admin role', async () => {
      await l1BridgeRegistry.transferAdmin(newAdmin.address)
      expect(await l1BridgeRegistry.isAdmin(newAdmin.address)).to.equal(true)
      expect(await l1BridgeRegistry.isAdmin(owner.address)).to.equal(false)
    })
  })
})

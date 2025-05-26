import type { AuthControlL1BridgeRegistry } from '@contracts/common/AuthControlL1BridgeRegistry'
import { AuthControlL1BridgeRegistry__factory } from '@factories/common/AuthControlL1BridgeRegistry__factory'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { setAdmin } from '@utils/AccessControl'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('AuthControlL1BridgeRegistry', () => {
  let authControlL1BridgeRegistry: AuthControlL1BridgeRegistry
  let admin: HardhatEthersSigner
  let newAdmin: HardhatEthersSigner
  let nonAdmin: HardhatEthersSigner
  let manager: HardhatEthersSigner
  let newManager: HardhatEthersSigner
  let nonManager: HardhatEthersSigner
  let registrant: HardhatEthersSigner
  let newRegistrant: HardhatEthersSigner
  let nonRegistrant: HardhatEthersSigner

  const snapshot = async () => {
    const factory = new AuthControlL1BridgeRegistry__factory().connect(admin)
    const authControlL1BridgeRegistry = await factory.deploy()

    await setAdmin(authControlL1BridgeRegistry.target, admin)

    await authControlL1BridgeRegistry.addManager(manager)
    await authControlL1BridgeRegistry.connect(manager).addRegistrant(registrant)

    return authControlL1BridgeRegistry
  }

  beforeEach(async () => {
    ;[admin, manager, registrant, newRegistrant, nonAdmin, nonManager, newManager, nonRegistrant, newAdmin] =
      await ethers.getSigners()
    authControlL1BridgeRegistry = await loadFixture(snapshot)
  })

  describe('Test for addAdmin', () => {
    it('should fail when non-admin tries to add admin', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).addAdmin(nonAdmin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlL1BridgeRegistry.addAdmin(admin)).to.be.revertedWith('already granted')
    })

    it('should add admin', async () => {
      await authControlL1BridgeRegistry.addAdmin(newAdmin)
      expect(await authControlL1BridgeRegistry.isAdmin(newAdmin)).to.equal(true)
    })
  })

  describe('Test for addManager', () => {
    it('should fail when non-admin tries to add manager', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonManager).addManager(nonManager)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlL1BridgeRegistry.addManager(manager)).to.be.revertedWith('already granted')
    })

    it('should add manager', async () => {
      await authControlL1BridgeRegistry.addManager(newManager)
      expect(await authControlL1BridgeRegistry.isManager(newManager)).to.equal(true)
    })
  })

  describe('Test for addRegistrant', () => {
    it('should fail when non-manager tries to add registrant', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonManager).addRegistrant(nonRegistrant)).to.be.revertedWith(
        'AuthControl: Caller is not a manager'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlL1BridgeRegistry.connect(manager).addRegistrant(registrant)).to.be.revertedWith(
        'already granted'
      )
    })

    it('should add registrant', async () => {
      await authControlL1BridgeRegistry.connect(manager).addRegistrant(newRegistrant)
      expect(await authControlL1BridgeRegistry.connect(manager).isRegistrant(newRegistrant)).to.equal(true)
    })
  })

  describe('Test for removeAdmin', () => {
    it('should fail when non-admin tries to remove admin', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).removeAdmin(admin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlL1BridgeRegistry.removeAdmin(nonAdmin)).to.be.revertedWith('already not granted')
    })

    it('should remove admin', async () => {
      await authControlL1BridgeRegistry.removeAdmin(admin)
      expect(await authControlL1BridgeRegistry.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for removeManager', () => {
    it('should fail when non-admin tries to remove manager', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).removeManager(manager)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlL1BridgeRegistry.removeManager(nonManager)).to.be.revertedWith('already not granted')
    })

    it('should remove manager', async () => {
      await authControlL1BridgeRegistry.removeManager(manager)
      expect(await authControlL1BridgeRegistry.isManager(manager)).to.equal(false)
    })
  })

  describe('Test for removeRegistrant', () => {
    it('should fail when non-manager tries to remove registrant', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonManager).removeRegistrant(registrant)).to.be.revertedWith(
        'AuthControl: Caller is not a manager'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlL1BridgeRegistry.connect(manager).removeRegistrant(nonRegistrant)).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should remove registrant', async () => {
      await authControlL1BridgeRegistry.connect(manager).removeRegistrant(registrant)
      expect(await authControlL1BridgeRegistry.connect(manager).isRegistrant(registrant)).to.equal(false)
    })
  })

  describe('Test for transferAdmin', () => {
    it('should fail when non-admin tries to transfer admin role', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).transferAdmin(newAdmin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when transfer admin role to same address', async () => {
      await expect(authControlL1BridgeRegistry.transferAdmin(admin)).to.be.revertedWith('Accessible: same admin')
    })

    it('should fail when transfer admin role to zero address', async () => {
      await expect(authControlL1BridgeRegistry.transferAdmin(ethers.ZeroAddress)).to.be.revertedWith(
        'Accessible: zero address'
      )
    })

    it('should fail when transfer admin role to admin', async () => {
      await authControlL1BridgeRegistry.addAdmin(newAdmin)
      await expect(authControlL1BridgeRegistry.transferAdmin(newAdmin)).to.be.revertedWith('already granted')
    })

    it('should transfer admin role', async () => {
      await authControlL1BridgeRegistry.transferAdmin(newAdmin)
      expect(await authControlL1BridgeRegistry.isAdmin(newAdmin)).to.equal(true)
      expect(await authControlL1BridgeRegistry.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for renounceOwnership', () => {
    it('should fail when non-admin tries to renounce ownership', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).renounceOwnership()).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should renounce ownership', async () => {
      await authControlL1BridgeRegistry.renounceOwnership()
      expect(await authControlL1BridgeRegistry.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for renounceManager', () => {
    it('should fail when non-manager tries to renounce manager', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonManager).renounceManager()).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should renounce manager', async () => {
      await authControlL1BridgeRegistry.connect(manager).renounceManager()
      expect(await authControlL1BridgeRegistry.isManager(manager)).to.equal(false)
    })
  })

  describe('Test for renounceRegistrant', () => {
    it('should fail when non-registrant tries to renounce registrant', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonRegistrant).renounceRegistrant()).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should renounce registrant', async () => {
      await authControlL1BridgeRegistry.connect(registrant).renounceRegistrant()
      expect(await authControlL1BridgeRegistry.isRegistrant(registrant)).to.equal(false)
    })
  })

  describe('Test for revokeManager', () => {
    it('should fail when non-admin tries to revoke manager', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).revokeManager(manager)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when not granted', async () => {
      await expect(authControlL1BridgeRegistry.connect(admin).revokeManager(nonManager)).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should revoke manager', async () => {
      await authControlL1BridgeRegistry.connect(admin).revokeManager(manager)
      expect(await authControlL1BridgeRegistry.isManager(manager)).to.equal(false)
    })
  })

  describe('Test for revokeRegistrant', () => {
    it('should fail when non-admin tries to revoke registrant', async () => {
      await expect(authControlL1BridgeRegistry.connect(nonAdmin).revokeRegistrant(registrant)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when not granted', async () => {
      await expect(authControlL1BridgeRegistry.connect(admin).revokeRegistrant(nonRegistrant)).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should revoke registrant', async () => {
      await authControlL1BridgeRegistry.connect(admin).revokeRegistrant(registrant)
      expect(await authControlL1BridgeRegistry.isRegistrant(registrant)).to.equal(false)
    })
  })

  describe('Test for isOwner', () => {
    it('should return true for admin', async () => {
      expect(await authControlL1BridgeRegistry.isOwner()).to.equal(true)
    })

    it('should return false for non-admin', async () => {
      expect(await authControlL1BridgeRegistry.connect(nonAdmin).isOwner()).to.equal(false)
    })
  })

  describe('Test for supportsInterface', () => {
    it('should return true for supportsInterface(bytes4)', async () => {
      expect(await authControlL1BridgeRegistry.supportsInterface('0x01ffc9a7')).to.equal(true)
    })
  })
})

import type { AccessibleCommon } from '@contracts/common/AccessibleCommon'
import { AccessibleCommon__factory } from '@factories/common/AccessibleCommon__factory'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { setAdmin } from '@utils/AccessControl'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('AccessibleCommon', () => {
  let accessibleCommon: AccessibleCommon
  let admin: HardhatEthersSigner
  let newAdmin: HardhatEthersSigner
  let nonAdmin: HardhatEthersSigner

  const snapshot = async () => {
    const factory = new AccessibleCommon__factory().connect(admin)
    const accessibleCommon = await factory.deploy()

    await setAdmin(accessibleCommon.target, admin)

    return accessibleCommon
  }

  beforeEach(async () => {
    ;[admin, newAdmin, nonAdmin] = await ethers.getSigners()
    accessibleCommon = await loadFixture(snapshot)
  })

  describe('Test for addAdmin', () => {
    it('should fail when non-admin tries to add admin', async () => {
      await expect(accessibleCommon.connect(nonAdmin).addAdmin(nonAdmin)).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(accessibleCommon.addAdmin(admin)).to.be.revertedWith('already granted')
    })

    it('should add admin', async () => {
      await accessibleCommon.addAdmin(newAdmin)
      expect(await accessibleCommon.isAdmin(newAdmin)).to.equal(true)
    })
  })

  describe('Test for removeAdmin', () => {
    it('should fail when non-admin tries to remove admin', async () => {
      await expect(accessibleCommon.connect(nonAdmin).removeAdmin(admin)).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(accessibleCommon.removeAdmin(nonAdmin)).to.be.revertedWith('already not granted')
    })

    it('should remove admin', async () => {
      await accessibleCommon.removeAdmin(admin)
      expect(await accessibleCommon.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for transferAdmin', () => {
    it('should fail when non-admin tries to transfer admin role', async () => {
      await expect(accessibleCommon.connect(nonAdmin).transferAdmin(newAdmin)).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('should fail when transfer admin role to same address', async () => {
      await expect(accessibleCommon.transferAdmin(admin)).to.be.revertedWith('Accessible: same admin')
    })

    it('should fail when transfer admin role to zero address', async () => {
      await expect(accessibleCommon.transferAdmin(ethers.ZeroAddress)).to.be.revertedWith('Accessible: zero address')
    })

    it('should fail when transfer admin role to admin', async () => {
      await accessibleCommon.addAdmin(newAdmin)
      await expect(accessibleCommon.transferAdmin(newAdmin)).to.be.revertedWith('already granted')
    })

    it('should transfer admin role', async () => {
      await accessibleCommon.transferAdmin(newAdmin)
      expect(await accessibleCommon.isAdmin(newAdmin)).to.equal(true)
      expect(await accessibleCommon.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for transferOwnership', () => {
    it('should fail when non-admin tries to transfer ownership', async () => {
      await expect(accessibleCommon.connect(nonAdmin).transferOwnership(newAdmin)).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('should transfer ownership', async () => {
      await accessibleCommon.transferOwnership(newAdmin)
      expect(await accessibleCommon.isAdmin(newAdmin)).to.equal(true)
      expect(await accessibleCommon.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for renounceOwnership', () => {
    it('should fail when non-admin tries to renounce ownership', async () => {
      await expect(accessibleCommon.connect(nonAdmin).renounceOwnership()).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('should renounce ownership', async () => {
      await accessibleCommon.renounceOwnership()
      expect(await accessibleCommon.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for isAdmin', () => {
    it('should return true for admin', async () => {
      expect(await accessibleCommon.isAdmin(admin)).to.equal(true)
    })

    it('should return false for non-admin', async () => {
      expect(await accessibleCommon.isAdmin(nonAdmin)).to.equal(false)
    })
  })

  describe('Test for isOwner', () => {
    it('should return true for admin', async () => {
      expect(await accessibleCommon.isOwner()).to.equal(true)
    })

    it('should return false for non-admin', async () => {
      expect(await accessibleCommon.connect(nonAdmin).isOwner()).to.equal(false)
    })
  })

  describe('Test for supportsInterface', () => {
    it('should return true for supportsInterface(bytes4)', async () => {
      expect(await accessibleCommon.supportsInterface('0x01ffc9a7')).to.equal(true)
    })
  })
})

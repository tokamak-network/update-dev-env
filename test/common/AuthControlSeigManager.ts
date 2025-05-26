import type { AuthControlSeigManager } from '@contracts/common/AuthControlSeigManager'
import { AuthControlSeigManager__factory } from '@factories/common/AuthControlSeigManager__factory'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { setAdmin } from '@utils/AccessControl'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('AuthControlSeigManager', () => {
  let authControlSeigManager: AuthControlSeigManager
  let admin: HardhatEthersSigner
  let newAdmin: HardhatEthersSigner
  let nonAdmin: HardhatEthersSigner
  let minter: HardhatEthersSigner
  let newMinter: HardhatEthersSigner
  let nonMinter: HardhatEthersSigner
  let operator: HardhatEthersSigner
  let newOperator: HardhatEthersSigner
  let nonOperator: HardhatEthersSigner
  let challenger: HardhatEthersSigner
  let newChallenger: HardhatEthersSigner
  let nonChallenger: HardhatEthersSigner

  const snapshot = async () => {
    const factory = new AuthControlSeigManager__factory().connect(admin)
    const authControlSeigManager = await factory.deploy()

    await setAdmin(authControlSeigManager.target, admin)
    await authControlSeigManager.addMinter(minter)
    await authControlSeigManager.addOperator(operator)
    await authControlSeigManager.addChallenger(challenger)

    return authControlSeigManager
  }

  beforeEach(async () => {
    ;[
      admin,
      minter,
      operator,
      newAdmin,
      nonAdmin,
      nonMinter,
      newMinter,
      challenger,
      nonChallenger,
      newChallenger,
      nonOperator,
      newOperator
    ] = await ethers.getSigners()
    authControlSeigManager = await loadFixture(snapshot)
  })

  describe('Test for addAdmin', () => {
    it('should fail when non-admin tries to add admin', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).addAdmin(nonAdmin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlSeigManager.addAdmin(admin)).to.be.revertedWith('already granted')
    })

    it('should add admin', async () => {
      await authControlSeigManager.addAdmin(newAdmin)
      expect(await authControlSeigManager.isAdmin(newAdmin)).to.equal(true)
    })
  })

  describe('Test for addMinter', () => {
    it('should fail when non-admin tries to add minter', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).addMinter(nonAdmin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlSeigManager.addMinter(minter)).to.be.revertedWith('already granted')
    })

    it('should add admin', async () => {
      await authControlSeigManager.addMinter(newMinter)
      expect(await authControlSeigManager.isMinter(newMinter)).to.equal(true)
    })
  })

  describe('Test for addOperator', () => {
    it('should fail when non-admin tries to add operator', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).addOperator(nonOperator)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlSeigManager.addOperator(operator)).to.be.revertedWith('already granted')
    })

    it('should add operator', async () => {
      await authControlSeigManager.addOperator(newOperator)
      expect(await authControlSeigManager.isOperator(newOperator)).to.equal(true)
    })
  })

  describe('Test for addChallenger', () => {
    it('should fail when non-admin and non-challenger tries to add challenger', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).addChallenger(nonChallenger)).to.be.revertedWith(
        'not onlyChallengerOrAdmin'
      )
    })

    it('should fail when already granted', async () => {
      await expect(authControlSeigManager.addChallenger(challenger)).to.be.revertedWith('already granted')
    })

    it('should add challenger by admin', async () => {
      await authControlSeigManager.addChallenger(newChallenger)
      expect(await authControlSeigManager.isChallenger(newChallenger)).to.equal(true)
    })

    it('should add challenger by challenger', async () => {
      await authControlSeigManager.connect(challenger).addChallenger(newChallenger)
      expect(await authControlSeigManager.isChallenger(newChallenger)).to.equal(true)
    })
  })

  describe('Test for removeAdmin', () => {
    it('should fail when non-admin tries to remove admin', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).removeAdmin(admin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlSeigManager.removeAdmin(nonAdmin)).to.be.revertedWith('already not granted')
    })

    it('should remove admin', async () => {
      await authControlSeigManager.removeAdmin(admin)
      expect(await authControlSeigManager.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for removeMinter', () => {
    it('should fail when non-admin tries to remove minter', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).removeMinter(minter)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlSeigManager.removeMinter(nonMinter)).to.be.revertedWith('already not granted')
    })

    it('should remove minter', async () => {
      await authControlSeigManager.removeMinter(minter)
      expect(await authControlSeigManager.isMinter(minter)).to.equal(false)
    })
  })

  describe('Test for removeOperator', () => {
    it('should fail when non-admin tries to remove operator', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).removeOperator(operator)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlSeigManager.removeOperator(nonOperator)).to.be.revertedWith('already not granted')
    })

    it('should remove operator', async () => {
      await authControlSeigManager.removeOperator(operator)
      expect(await authControlSeigManager.isOperator(operator)).to.equal(false)
    })
  })

  describe('Test for removeChallenger', () => {
    it('should fail when non-admin tries to remove challenger', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).removeChallenger(challenger)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when already not granted', async () => {
      await expect(authControlSeigManager.removeChallenger(nonChallenger)).to.be.revertedWith('already not granted')
    })

    it('should remove challenger', async () => {
      await authControlSeigManager.removeChallenger(challenger)
      expect(await authControlSeigManager.isChallenger(challenger)).to.equal(false)
    })
  })

  describe('Test for transferAdmin', () => {
    it('should fail when non-admin tries to transfer admin role', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).transferAdmin(newAdmin)).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should fail when transfer admin role to same address', async () => {
      await expect(authControlSeigManager.transferAdmin(admin)).to.be.revertedWith('Accessible: same admin')
    })

    it('should fail when transfer admin role to zero address', async () => {
      await expect(authControlSeigManager.transferAdmin(ethers.ZeroAddress)).to.be.revertedWith(
        'Accessible: zero address'
      )
    })

    it('should fail when transfer admin role to admin', async () => {
      await authControlSeigManager.addAdmin(newAdmin)
      await expect(authControlSeigManager.transferAdmin(newAdmin)).to.be.revertedWith('already granted')
    })

    it('should transfer admin role', async () => {
      await authControlSeigManager.transferAdmin(newAdmin)
      expect(await authControlSeigManager.isAdmin(newAdmin)).to.equal(true)
      expect(await authControlSeigManager.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for renounceOwnership', () => {
    it('should fail when non-admin tries to renounce ownership', async () => {
      await expect(authControlSeigManager.connect(nonAdmin).renounceOwnership()).to.be.revertedWith(
        'AuthControl: Caller is not an admin'
      )
    })

    it('should renounce ownership', async () => {
      await authControlSeigManager.renounceOwnership()
      expect(await authControlSeigManager.isAdmin(admin)).to.equal(false)
    })
  })

  describe('Test for renounceMinter', () => {
    it('should fail when non-minter tries to renounce minter', async () => {
      await expect(authControlSeigManager.connect(nonMinter).renounceMinter()).to.be.revertedWith('already not granted')
    })

    it('should renounce minter', async () => {
      await authControlSeigManager.connect(minter).renounceMinter()
      expect(await authControlSeigManager.isMinter(minter)).to.equal(false)
    })
  })

  describe('Test for renounceOperator', () => {
    it('should fail when non-operator tries to renounce operator', async () => {
      await expect(authControlSeigManager.connect(nonOperator).renounceOperator()).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should renounce operator', async () => {
      await authControlSeigManager.connect(operator).renounceOperator()
      expect(await authControlSeigManager.isOperator(operator)).to.equal(false)
    })
  })

  describe('Test for renounceChallenger', () => {
    it('should fail when non-challenger tries to renounce challenger', async () => {
      await expect(authControlSeigManager.connect(nonChallenger).renounceChallenger()).to.be.revertedWith(
        'already not granted'
      )
    })

    it('should renounce challenger', async () => {
      await authControlSeigManager.connect(challenger).renounceChallenger()
      expect(await authControlSeigManager.isChallenger(challenger)).to.equal(false)
    })
  })

  describe('Test for isOwner', () => {
    it('should return true for admin', async () => {
      expect(await authControlSeigManager.isOwner()).to.equal(true)
    })

    it('should return false for non-admin', async () => {
      expect(await authControlSeigManager.connect(nonAdmin).isOwner()).to.equal(false)
    })
  })

  describe('Test for supportsInterface', () => {
    it('should return true for supportsInterface(bytes4)', async () => {
      expect(await authControlSeigManager.supportsInterface('0x01ffc9a7')).to.equal(true)
    })
  })
})

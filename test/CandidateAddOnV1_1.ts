import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { getStorageAt, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers, getNamedAccounts } from 'hardhat'

describe('CandidateAddOnV1_1', () => {
  let owner: HardhatEthersSigner
  let nonOwner: HardhatEthersSigner

  const deployCandidateAddOnAndOperatorManager = async () => {
    const [owner] = await ethers.getSigners()
    const candidateAddOn = await ethers.deployContract('CandidateAddOnV1_1')
    const role = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const rolesStorageSlot = 5
    const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
    const outerSlot = ethers.keccak256(encodedOuter)
    const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [owner.address, BigInt(outerSlot)]
    )
    const memberSlot = ethers.keccak256(encodedMember)
    await setStorageAt(candidateAddOn.target.toString(), memberSlot, ethers.zeroPadValue('0x01', 32))

    const operatorManager = await ethers.deployContract('OperatorManagerV1_1')
    await setStorageAt(
      operatorManager.target.toString(),
      '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
      ethers.Wallet.createRandom().address
    )

    return { operatorManager, candidateAddOn }
  }

  beforeEach(async () => {
    ;[owner, nonOwner] = await ethers.getSigners()
  })

  describe('Tests for initialize', () => {
    it('should fail when non-owner tries to initialize', async () => {
      const { SEIG_MANAGER, TON, WTON, DAO_COMMITTEE } = await getNamedAccounts()
      const { operatorManager, candidateAddOn } = await loadFixture(deployCandidateAddOnAndOperatorManager)
      await expect(
        candidateAddOn.connect(nonOwner).initialize(operatorManager, 'test', DAO_COMMITTEE, SEIG_MANAGER, TON, WTON)
      ).to.be.revertedWith('Accessible: Caller is not an admin')
    })

    it("should fail when operatorManager's rollupConfig is zero address", async () => {
      const { SEIG_MANAGER, TON, WTON, DAO_COMMITTEE } = await getNamedAccounts()
      const { operatorManager, candidateAddOn } = await loadFixture(deployCandidateAddOnAndOperatorManager)
      await setStorageAt(
        operatorManager.target.toString(),
        '0xd8bedf058aa85a36377d4cf75d156448984f1301b93d1653448986b1166437d6',
        ethers.ZeroAddress
      )
      await expect(
        candidateAddOn.initialize(operatorManager, 'test', DAO_COMMITTEE, SEIG_MANAGER, TON, WTON)
      ).to.be.revertedWith('zero rollupConfig')
    })

    it('should fail when owner tries to initialize twice', async () => {
      const { SEIG_MANAGER, TON, WTON, DAO_COMMITTEE } = await getNamedAccounts()
      const { operatorManager, candidateAddOn } = await loadFixture(deployCandidateAddOnAndOperatorManager)
      await candidateAddOn.initialize(operatorManager, 'test', DAO_COMMITTEE, SEIG_MANAGER, TON, WTON)
      await expect(
        candidateAddOn.initialize(operatorManager, 'test', DAO_COMMITTEE, SEIG_MANAGER, TON, WTON)
      ).to.be.revertedWith('Already initialized')
    })

    it('should initialize', async () => {
      const { SEIG_MANAGER, TON, WTON, DAO_COMMITTEE } = await getNamedAccounts()
      const { operatorManager, candidateAddOn } = await loadFixture(deployCandidateAddOnAndOperatorManager)

      await candidateAddOn.initialize(operatorManager, 'test', DAO_COMMITTEE, SEIG_MANAGER, TON, WTON)

      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0xa62771101a79dd4b4d7b861524e85faa4569e99d6bb6b09233805dccb1ea480e' // CANDIDATE
        )
      ).to.equal(ethers.zeroPadValue(operatorManager.target.toString(), 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0xed7ead75dab2b778f814bef3e24d121e608a2464b0363d0d34b193757e18edb7' // COMMITTEE
        )
      ).to.equal(ethers.zeroPadValue(DAO_COMMITTEE, 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0x7088c9d198dd5a695a7839f4b2a2bf4569dc44d17d42047752072568a6f42416' // SEIGMANAGER
        )
      ).to.equal(ethers.zeroPadValue(SEIG_MANAGER, 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0x88940a795d305b6429c31402afcae61ef7d829b8a9fe2a9861b8c30cd60e80ec' // TON
        )
      ).to.equal(ethers.zeroPadValue(TON, 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0x5fa7357c3468b094bc9c15b746af6189f046af1501ae9751f49e7b4dd5616e97' // WTON
        )
      ).to.equal(ethers.zeroPadValue(WTON, 32))
    })

    // it('should fail if _committee is zero address', async () => {
    //   const { SEIG_MANAGER, TON, WTON } = await getNamedAccounts()
    //   const { operatorManager, candidateAddOn } = await loadFixture(deployCandidateAddOnAndOperatorManager)
    //   await expect(
    //     candidateAddOn.initialize(operatorManager, 'test', ethers.ZeroAddress, SEIG_MANAGER, TON, WTON)
    //   ).to.be.revertedWith('Candidate: input is zero')
    // })
  })
})

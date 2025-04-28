import { deployOperatorManagerFactory } from '@/fixtures'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { getStorageAt, impersonateAccount, setBalance, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers, getNamedAccounts } from 'hardhat'

describe('CandidateAddOnV1_1', () => {
  let owner: HardhatEthersSigner
  let nonOwner: HardhatEthersSigner

  const generateAddresses = () => {
    const seigManager = ethers.Wallet.createRandom().address
    const daoCommittee = ethers.Wallet.createRandom().address
    const ton = ethers.Wallet.createRandom().address
    const wton = ethers.Wallet.createRandom().address
    return { seigManager, daoCommittee, ton, wton }
  }

  const deployCandidateAddOn = async () => {
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

    return { candidateAddOn }
  }

  const initializeCandidateAddOn = async () => {
    const { candidateAddOn } = await loadFixture(deployCandidateAddOn)

    const { ton, wton } = generateAddresses()
    const seigManager = await ethers.deployContract('MockSeigManager')
    const coinage = await ethers.deployContract('MockCoinage')
    await seigManager.setCoinage(candidateAddOn, coinage)

    const daoCommittee = await ethers.deployContract('MockDaoCommittee')
    const operatorManager = await ethers.deployContract('MockOperatorManager')
    await operatorManager.setRollupConfig(ethers.Wallet.createRandom().address)

    await candidateAddOn.initialize(operatorManager, 'TEST', daoCommittee, seigManager, ton, wton)
    return { daoCommittee, owner, seigManager, ton, wton, operatorManager, candidateAddOn, coinage }
  }

  beforeEach(async () => {
    ;[owner, nonOwner] = await ethers.getSigners()
  })

  describe('Tests for initialize', () => {
    it('should fail when non-owner tries to initialize', async () => {
      const { candidateAddOn } = await loadFixture(deployCandidateAddOn)
      const { seigManager, ton, wton, daoCommittee } = generateAddresses()
      const operatorManager = await ethers.deployContract('MockOperatorManager')
      await expect(
        candidateAddOn.connect(nonOwner).initialize(operatorManager, 'test', daoCommittee, seigManager, ton, wton)
      ).to.be.revertedWith('Accessible: Caller is not an admin')
    })
    it("should fail when operatorManager's rollupConfig is zero address", async () => {
      const { candidateAddOn } = await loadFixture(deployCandidateAddOn)
      const { seigManager, ton, wton, daoCommittee } = generateAddresses()
      const operatorManager = await ethers.deployContract('MockOperatorManager')
      await expect(
        candidateAddOn.initialize(operatorManager.target, 'test', daoCommittee, seigManager, ton, wton)
      ).to.be.revertedWith('zero rollupConfig')
    })

    it('should fail when owner tries to initialize twice', async () => {
      const { candidateAddOn } = await loadFixture(deployCandidateAddOn)
      const { daoCommittee, seigManager, ton, wton } = generateAddresses()
      const operatorManager = await ethers.deployContract('MockOperatorManager')
      await operatorManager.setRollupConfig(ethers.Wallet.createRandom().address)
      await candidateAddOn.initialize(operatorManager, 'test', daoCommittee, seigManager, ton, wton)
      await expect(
        candidateAddOn.initialize(operatorManager, 'test', daoCommittee, seigManager, ton, wton)
      ).to.be.revertedWith('Already initialized')
    })

    it('initialize', async () => {
      const { candidateAddOn } = await loadFixture(deployCandidateAddOn)
      const { daoCommittee, seigManager, ton, wton } = generateAddresses()
      const operatorManager = await ethers.deployContract('MockOperatorManager')
      await operatorManager.setRollupConfig(ethers.Wallet.createRandom().address)

      await candidateAddOn.initialize(operatorManager, 'test', daoCommittee, seigManager, ton, wton)

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
      ).to.equal(ethers.zeroPadValue(daoCommittee, 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0x7088c9d198dd5a695a7839f4b2a2bf4569dc44d17d42047752072568a6f42416' // SEIGMANAGER
        )
      ).to.equal(ethers.zeroPadValue(seigManager, 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0x88940a795d305b6429c31402afcae61ef7d829b8a9fe2a9861b8c30cd60e80ec' // TON
        )
      ).to.equal(ethers.zeroPadValue(ton, 32))
      expect(
        await getStorageAt(
          candidateAddOn.target.toString(),
          '0x5fa7357c3468b094bc9c15b746af6189f046af1501ae9751f49e7b4dd5616e97' // WTON
        )
      ).to.equal(ethers.zeroPadValue(wton, 32))
    })
  })

  describe('Tests for setMemo', () => {
    it('should fail when non-owner tries to setMemo', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      await expect(candidateAddOn.connect(nonOwner).setMemo('test')).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('setMemo', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      await candidateAddOn.setMemo('test')
      expect(await candidateAddOn.memo()).to.equal('test')
    })
  })

  describe('Tests for changeMember', () => {
    it('should fail when non-operator tries to changeMember', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      await expect(candidateAddOn.connect(nonOwner).changeMember(0)).to.be.revertedWith('sender is not an operator')
    })

    it('changeMember', async () => {
      const { candidateAddOn, operatorManager } = await loadFixture(initializeCandidateAddOn)
      await operatorManager.setOperator(owner.address)
      await candidateAddOn.changeMember(0)
    })
  })

  describe('Tests for retierMember', async () => {
    it('should fail when non-operator tries to retireMember', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      await expect(candidateAddOn.connect(nonOwner).retireMember()).to.be.revertedWith('sender is not an operator')
    })

    it('retireMember', async () => {
      const { candidateAddOn, operatorManager } = await loadFixture(initializeCandidateAddOn)
      await operatorManager.setOperator(owner.address)
      await candidateAddOn.retireMember()
    })
  })

  describe('Tests for castVote', () => {
    it('should fail when non-operator tries to castVote', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      await expect(candidateAddOn.connect(nonOwner).castVote(0, 0, 'test')).to.be.revertedWith(
        'sender is not an operator'
      )
    })

    it('castVote', async () => {
      const { candidateAddOn, operatorManager } = await loadFixture(initializeCandidateAddOn)
      await operatorManager.setOperator(owner.address)
      await candidateAddOn.castVote(0, 0, 'test')
    })
  })

  describe('Tests for claimActivityReward', () => {
    it('should fail when non-operator tries to claimActivityReward', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      await expect(candidateAddOn.connect(nonOwner).claimActivityReward()).to.be.revertedWith(
        'sender is not an operator'
      )
    })

    it('claimActivityReward', async () => {
      const { candidateAddOn, daoCommittee, operatorManager } = await loadFixture(initializeCandidateAddOn)
      await operatorManager.setOperator(owner.address)
      await expect(candidateAddOn.claimActivityReward())
        .to.be.emit(daoCommittee, 'ClaimedActivityReward')
        .withArgs(operatorManager, operatorManager, 0)
    })
  })

  describe('Tests for updateSeigniorage', () => {
    it('should revert when seigManager returns false', async () => {
      const { candidateAddOn, seigManager } = await loadFixture(initializeCandidateAddOn)
      await seigManager.setReturnValue(false)
      await expect(candidateAddOn.updateSeigniorage()).to.be.revertedWith('fail updateSeigniorage')
    })

    it('updateSeigniorage', async () => {
      const { candidateAddOn, seigManager } = await loadFixture(initializeCandidateAddOn)
      await expect(candidateAddOn.updateSeigniorage()).to.be.emit(seigManager, 'Comitted').withArgs(candidateAddOn)
    })
  })

  describe('Tests for view methods', () => {
    it('operator', async () => {
      const { candidateAddOn, operatorManager } = await loadFixture(initializeCandidateAddOn)
      expect(await candidateAddOn.operator()).to.equal(operatorManager)
    })

    it('isLayer2', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      expect(await candidateAddOn.isLayer2()).to.equal(true)
    })

    it('currentFork', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      expect(await candidateAddOn.currentFork()).to.equal(1)
    })

    it('lastEpoch', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      expect(await candidateAddOn.lastEpoch(1)).to.equal(1)
    })

    it('isCandidateContract', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      expect(await candidateAddOn.isCandidateContract()).to.equal(true)
    })

    it('isCandidateFwContract', async () => {
      const { candidateAddOn } = await loadFixture(initializeCandidateAddOn)
      expect(await candidateAddOn.isCandidateFwContract()).to.equal(true)
    })

    it('totalStaked', async () => {
      const { candidateAddOn, coinage } = await loadFixture(initializeCandidateAddOn)
      const randomValue = Math.floor(Math.random() * 10000)
      await coinage.setTotalSupply(randomValue)
      expect(await candidateAddOn.totalStaked()).to.equal(randomValue)
    })

    it('stakedOf', async () => {
      const { candidateAddOn, coinage } = await loadFixture(initializeCandidateAddOn)
      const randomValue = Math.floor(Math.random() * 10000)
      await coinage.setBalanceOf(candidateAddOn, randomValue)
      expect(await candidateAddOn.stakedOf(candidateAddOn)).to.equal(randomValue)
    })
  })
})

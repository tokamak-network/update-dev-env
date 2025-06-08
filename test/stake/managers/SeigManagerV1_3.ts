import type { MockCandidateAddOn } from '@contracts/mocks/MockCandidateAddOn'
import type { MockCoinage } from '@contracts/mocks/MockCoinage'
import type { MockL1BridgeRegistryV1_1 } from '@contracts/mocks/MockL1BridgeRegistryV1_1'
import type { MockLayer2Manager } from '@contracts/mocks/MockLayer2Manager'
import type { MockWTON } from '@contracts/mocks/MockWTON'
import type { SeigManagerV1_3 } from '@contracts/stake/managers/SeigManagerV1_3'
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture, mine, setBalance, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import type { AddressLike } from 'ethers'
import { ethers } from 'hardhat'
import {
  grantAdminRole,
  grantPauseRole,
  impersonate,
  setBurntAmountAtDAO,
  setCoinage,
  setCommissionRate,
  setDAO,
  setDAOSeigRate,
  setDelayedCommissionBlock,
  setDelayedCommissionRate,
  setDepositManager,
  setInitialTotalSupply,
  setIsCommissionRateNegative,
  setLastSeigBlock,
  setMinimumAmount,
  setPowerTON,
  setPowerTONSeigRate,
  setSeigPerBlock,
  setSeigStartBlock,
  setTON,
  setTotalCoinage,
  setWTON
} from 'utils'

describe('SeigManagerV1_3', () => {
  let seigManager: SeigManagerV1_3
  let candidateAddOn: MockCandidateAddOn
  let coinage: MockCoinage
  let totalCoinage: MockCoinage
  let owner: SignerWithAddress
  let nonOwner: SignerWithAddress
  let candidateAddOnSigner: SignerWithAddress
  let layer2ManagerSigner: SignerWithAddress
  let layer2Manager: MockLayer2Manager
  let rollupConfig: AddressLike
  let powerton: AddressLike
  let dao: AddressLike
  let wton: MockWTON
  let l1BridgeRegistry: MockL1BridgeRegistryV1_1

  let initialTotalSupply: number
  let seigPerBlock: number

  // 0xfcb9fcbfa83b897fb2d5cf4b58962164105c1e71489a37ef3ae0db3fdce576f6

  const stake = async (operator: AddressLike, staker: AddressLike) => {
    await setSeigPerBlock(seigManager.target.toString(), ++seigPerBlock)

    await coinage.mint(staker, ethers.parseUnits('1', 27))
    await totalCoinage.mint(operator, ethers.parseUnits('1', 27))
    await setInitialTotalSupply(seigManager.target.toString(), ++initialTotalSupply)

    const blockNumber = await ethers.provider.getBlockNumber()
    await setSeigStartBlock(seigManager.target.toString(), blockNumber)
    await setLastSeigBlock(seigManager.target.toString(), blockNumber)
  }

  const deploy = async () => {
    const [owner, nonOwner] = await ethers.getSigners()
    const seigManager = await ethers.deployContract('SeigManagerV1_3')

    await grantAdminRole(seigManager.target.toString(), owner.address)
    await grantPauseRole(seigManager.target.toString(), owner.address)

    await setSeigPerBlock(seigManager.target.toString(), 1)

    const layer2Manager = await ethers.deployContract('MockLayer2Manager')
    await setStorageAt(seigManager.target.toString(), 37, ethers.zeroPadValue(layer2Manager.target.toString(), 32))

    const depositManager = ethers.Wallet.createRandom().address
    await setDepositManager(seigManager.target.toString(), depositManager)

    const l1BridgeRegistry = await ethers.deployContract('MockL1BridgeRegistryV1_1')
    await setStorageAt(seigManager.target.toString(), 36, ethers.zeroPadValue(l1BridgeRegistry.target.toString(), 32))

    const layer2ManagerSigner = await impersonate(layer2Manager.target.toString())
    setBalance(layer2ManagerSigner.address, ethers.parseEther('1'))

    const rollupConfig = ethers.Wallet.createRandom().address

    const candidateAddOn = await ethers.deployContract('MockCandidateAddOn')
    await candidateAddOn.setOperator(owner)
    await layer2Manager.setRollupConfig(candidateAddOn, rollupConfig)

    const totalCoinage = await ethers.deployContract('MockCoinage')
    await totalCoinage.setFactor(10n ** 27n)
    await setTotalCoinage(
      seigManager.target.toString(),
      candidateAddOn.target.toString(),
      totalCoinage.target.toString()
    )

    const coinage = await ethers.deployContract('MockCoinage')
    await coinage.setFactor(10n ** 27n)
    await setCoinage(seigManager.target.toString(), candidateAddOn.target.toString(), coinage.target.toString())

    const candidateAddOnSigner = await impersonate(candidateAddOn.target.toString())
    setBalance(candidateAddOnSigner.address, ethers.parseEther('1'))

    const ton = await ethers.deployContract('MockTON')
    await setTON(seigManager.target.toString(), ton.target.toString())

    const wton = await ethers.deployContract('MockWTON', [ton])
    await setWTON(seigManager.target.toString(), wton.target.toString())

    const dao = ethers.Wallet.createRandom().address
    await setDAO(seigManager.target.toString(), dao)

    const powerton = ethers.Wallet.createRandom().address
    await setPowerTON(seigManager.target.toString(), powerton)

    await setInitialTotalSupply(seigManager.target.toString(), 1)
    await setBurntAmountAtDAO(seigManager.target.toString(), 1)

    return {
      seigManager,
      layer2Manager,
      layer2ManagerSigner,
      candidateAddOn,
      rollupConfig,
      candidateAddOnSigner,
      coinage,
      totalCoinage,
      ton,
      wton,
      dao,
      powerton,
      depositManager,
      owner,
      nonOwner,
      l1BridgeRegistry
    }
  }

  beforeEach(async () => {
    ;({
      seigManager,
      coinage,
      totalCoinage,
      owner,
      nonOwner,
      candidateAddOn,
      candidateAddOnSigner,
      layer2ManagerSigner,
      layer2Manager,
      rollupConfig,
      powerton,
      wton,
      dao,
      l1BridgeRegistry
    } = await loadFixture(deploy))

    seigPerBlock = 0
    initialTotalSupply = 1
  })

  describe('Tests for pause', () => {
    beforeEach(async () => {
      const blockNumber = await ethers.provider.getBlockNumber()
      await setLastSeigBlock(seigManager.target.toString(), blockNumber)
    })

    it('should revert when non-admin calls pause', async () => {
      await expect(seigManager.connect(nonOwner).pause()).to.be.revertedWith('AuthControl: Caller is not a pauser')
    })

    it('should revert when already paused', async () => {
      await seigManager.pause()

      await expect(seigManager.pause()).to.be.revertedWith('Pausable: paused')
    })

    it('should revert when _lastSeigBlock <= _pausedBlock', async () => {
      await seigManager.pause()
      await seigManager.unpause()

      // At this point _pausedBlock == _lastSeigBlock
      await expect(seigManager.pause()).to.be.revertedWith('updateSeigniorage required')
    })

    it('should pause seigniorage', async () => {
      await seigManager.pause()
      expect(await seigManager.paused()).to.be.true
    })
  })

  describe('Tests for unpause', () => {
    it('should revert when non-admin calls unpause', async () => {
      await expect(seigManager.connect(nonOwner).unpause()).to.be.revertedWith('AuthControl: Caller is not a pauser')
    })

    it('should revert when not paused', async () => {
      await expect(seigManager.unpause()).to.be.revertedWith('Pausable: not paused')
    })

    it('should unpause seigniorage', async () => {
      const blockNumber = await ethers.provider.getBlockNumber()
      await setLastSeigBlock(seigManager.target.toString(), blockNumber)

      await seigManager.pause()
      await seigManager.unpause()

      expect(await seigManager.paused()).to.be.false
    })
  })

  describe('Tests for excludeFromL2Seigniorage', () => {
    it('should revert when non-layer2Manager calls excludeFromL2Seigniorage', async () => {
      await expect(seigManager.excludeFromL2Seigniorage(candidateAddOn)).to.be.revertedWithCustomError(
        seigManager,
        'OnlyLayer2ManagerError'
      )
    })

    it('should revert when already paused', async () => {
      await seigManager.connect(layer2ManagerSigner).excludeFromL2Seigniorage(candidateAddOn)
      await expect(
        seigManager.connect(layer2ManagerSigner).excludeFromL2Seigniorage(candidateAddOn)
      ).to.be.revertedWith('already paused')
    })

    it('should pause Layer2 TVL correctly', async () => {
      await seigManager.connect(layer2ManagerSigner).excludeFromL2Seigniorage(candidateAddOn)

      const blockNumber = await ethers.provider.getBlockNumber()
      expect(await seigManager.layer2PauseBlocks(candidateAddOn.target.toString(), 0)).to.be.eq(blockNumber)
    })
  })

  describe('Tests for includeFromL2Seigniorage', () => {
    it('should revert when non-layer2Manager calls includeFromL2Seigniorage', async () => {
      await expect(seigManager.includeFromL2Seigniorage(candidateAddOn)).to.be.revertedWithCustomError(
        seigManager,
        'OnlyLayer2ManagerError'
      )
    })

    it('should revert when unregistered rollupConfig calls includeFromL2Seigniorage', async () => {
      await expect(
        seigManager.connect(layer2ManagerSigner).includeFromL2Seigniorage(candidateAddOn)
      ).to.be.revertedWith('not allowed')
    })

    it('should revert when not paused layer2 calls includeFromL2Seigniorage', async () => {
      await layer2Manager.setStatusLayer2(rollupConfig, 1)
      await expect(
        seigManager.connect(layer2ManagerSigner).includeFromL2Seigniorage(candidateAddOn)
      ).to.be.revertedWith('not paused')
    })

    it('should unpause Layer2 TVL correctly', async () => {
      await layer2Manager.setStatusLayer2(rollupConfig, 1)
      await seigManager.connect(layer2ManagerSigner).excludeFromL2Seigniorage(candidateAddOn)
      await seigManager.connect(layer2ManagerSigner).includeFromL2Seigniorage(candidateAddOn)
      const pauseBlocks = await seigManager.layer2PauseBlocks(candidateAddOn.target.toString(), 0)

      const blockNumber = await ethers.provider.getBlockNumber()
      expect(await seigManager.layer2UnpauseBlocks(candidateAddOn.target.toString(), pauseBlocks)).to.be.eq(blockNumber)
    })
  })

  describe('Tests for updateSeigniorageLayer', () => {
    it('updateSeigniorageLayer', async () => {
      await expect(seigManager.updateSeigniorageLayer(candidateAddOn)).to.be.emit(candidateAddOn, 'UpdateSeigniorage')
    })
  })

  describe('Tests for updateSeigniorage', () => {
    it('should revert when the coinage is address(0)', async () => {
      await setCoinage(seigManager.target.toString(), candidateAddOn.target.toString(), ethers.ZeroAddress)
      await expect(seigManager.updateSeigniorage()).to.be.revertedWithCustomError(seigManager, 'InvalidCoinageError')
    })

    it('should revert when the _lastSeigBlock == block.number', async () => {
      const blockNumber = await ethers.provider.getBlockNumber()
      await setLastSeigBlock(seigManager.target.toString(), blockNumber + 1)
      await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage()).to.be.revertedWithCustomError(
        seigManager,
        'LastSeigBlockError'
      )
    })

    it('should revert when the _lastSeigBlock > block.number', async () => {
      const blockNumber = await ethers.provider.getBlockNumber()
      await setLastSeigBlock(seigManager.target.toString(), blockNumber + 2)
      await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage()).to.be.revertedWithCustomError(
        seigManager,
        'LastSeigBlockError'
      )
    })

    it('should revert when the staked amount of operator is less than the minimumAmount', async () => {
      await setMinimumAmount(seigManager.target.toString(), 1)
      await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage()).to.be.revertedWithCustomError(
        seigManager,
        'MinimumAmountError'
      )
    })

    it('should revert when _increaseTot method returns false', async () => {
      await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage()).to.be.revertedWithCustomError(
        seigManager,
        'IncreaseTotError'
      )
    })

    it('should distribute unstakedSeig to PowerTON', async () => {
      await setPowerTONSeigRate(seigManager.target.toString(), 1)
      setBalance(candidateAddOn.target.toString(), ethers.parseEther('1'))
      await stake(candidateAddOn, owner)

      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      expect(await wton.balanceOf(powerton)).to.be.equal(ethers.parseUnits('0.5', 27))
    })

    it('should distribute unstakedSeig to DAO', async () => {
      await setDAOSeigRate(seigManager.target.toString(), 1)
      setBalance(candidateAddOn.target.toString(), ethers.parseEther('1'))
      await stake(candidateAddOn, owner)

      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      expect(await wton.balanceOf(dao)).to.be.equal(ethers.parseUnits('0.5', 27))
    })

    it('should distribute unstakedSeig to PowerTON and DAO', async () => {
      await setPowerTONSeigRate(seigManager.target.toString(), 0.5)
      await setDAOSeigRate(seigManager.target.toString(), 0.5)
      await stake(candidateAddOn, owner)

      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      expect(await wton.balanceOf(powerton)).to.be.equal(ethers.parseUnits('0.25', 27))
      expect(await wton.balanceOf(dao)).to.be.equal(ethers.parseUnits('0.25', 27))
    })

    it('should distribute seigniorage', async () => {
      setBalance(candidateAddOn.target.toString(), ethers.parseEther('1'))
      await stake(candidateAddOn, owner)

      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      expect(await wton.balanceOf(powerton)).to.be.equal(0)
      expect(await wton.balanceOf(dao)).to.be.equal(0)
      expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.5', 27))
    })
  })

  describe('Tests for _calcSeigsDistribution', () => {
    beforeEach(async () => {
      await stake(candidateAddOn, owner)
    })

    describe('Tests for Delayed Commission Rate', () => {
      it('should distribute commission after delayed commission block', async () => {
        await setDelayedCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 0.5)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        const blockNumber = await ethers.provider.getBlockNumber()
        await setDelayedCommissionBlock(
          seigManager.target.toString(),
          candidateAddOn.target.toString(),
          blockNumber + 1
        )

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            ethers.parseUnits('0.5', 27), // operatorSeigs
            ethers.parseUnits('2.5', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.75', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1.25', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })

      it("shouldn't distribute commission before delayed commission block", async () => {
        await setDelayedCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 0.5)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        const blockNumber = await ethers.provider.getBlockNumber()
        await setDelayedCommissionBlock(
          seigManager.target.toString(),
          candidateAddOn.target.toString(),
          blockNumber + 2
        )

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            0, // operatorSeigs
            ethers.parseUnits('3', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })
    })

    describe('Tests for Positive Commission Rate', () => {
      it("shouldn't distribute commission to operator when there is no other stakers", async () => {
        // Set commission rate to 1(100%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 1)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('0.5', 27), // seigs
            ethers.parseUnits('0.5', 27), // operatorSeigs
            ethers.parseUnits('1', 27), // nextTotalSupply
            ethers.parseUnits('1', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('1.5', 27))
      })

      it('should distribute all of seigniorage to operator when commission rate is 1', async () => {
        // Set commission rate to 1(100%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 1)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            ethers.parseUnits('1', 27), // operatorSeigs
            ethers.parseUnits('2', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('2', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })

      it('should distribute half of seigniorage to operator when commission rate is 0.5', async () => {
        // Set commission rate to 0.5(50%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 0.5)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            ethers.parseUnits('0.5', 27), // operatorSeigs
            ethers.parseUnits('2.5', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.75', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1.25', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })

      it("shouldn't distribute seigniorage to operator when commission rate is 0", async () => {
        // Set commission rate to 0(0%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 0)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            0, // operatorSeigs
            ethers.parseUnits('3', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })
    })

    describe('Tests for Negative Commission Rate', () => {
      beforeEach(async () => {
        // Set commission rate to negative
        await setIsCommissionRateNegative(seigManager.target.toString(), candidateAddOn.target.toString(), true)
      })

      it("shouldn't distribute commission to operator when there is no other stakers", async () => {
        // Set commission rate to 1(100%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 1)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('0.5', 27), // seigs
            ethers.parseUnits('0.5', 27), // operatorSeigs
            ethers.parseUnits('2', 27), // nextTotalSupply
            ethers.parseUnits('1', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('1.5', 27))
      })

      it("should distribute all of the operator's seigniorage to stakers when commission rate is 1", async () => {
        // Set commission rate to 1(100%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 1)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            ethers.parseUnits('1', 27), // operatorSeigs
            ethers.parseUnits('4', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('2', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })

      it("should distribute half of the operator's seigniorage to stakers when commission rate is 0.5", async () => {
        // Set commission rate to 0.5(50%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 0.5)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            ethers.parseUnits('0.5', 27), // operatorSeigs
            ethers.parseUnits('3.5', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect((await coinage.balanceOf(owner)) + 1n).to.be.equal(ethers.parseUnits('1.25', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1.75', 27))
        expect((await coinage.totalSupply()) + 1n).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })

      it("shouldn't distribute operator's seigniorage to stakers when commission rate is 0", async () => {
        // Set commission rate to 0(0%)
        await setCommissionRate(seigManager.target.toString(), candidateAddOn.target.toString(), 0)

        const staker = ethers.Wallet.createRandom().address
        await stake(candidateAddOn, staker)

        await expect(seigManager.connect(candidateAddOnSigner).updateSeigniorage())
          .to.be.emit(seigManager, 'AddedSeigAtLayer')
          .withArgs(
            candidateAddOn,
            ethers.parseUnits('1', 27), // seigs
            0, // operatorSeigs
            ethers.parseUnits('3', 27), // nextTotalSupply
            ethers.parseUnits('2', 27) // prevTotalSupply
          )

        expect(await coinage.balanceOf(owner)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.balanceOf(staker)).to.be.equal(ethers.parseUnits('1.5', 27))
        expect(await coinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
        expect(await totalCoinage.totalSupply()).to.be.equal(ethers.parseUnits('3', 27))
      })
    })
  })

  describe('Tests for Layer2 TVL', () => {
    it("shouldn't update layer2 TVL when layer2 is not allowed", async () => {
      await l1BridgeRegistry.setLayer2TVL(rollupConfig, ethers.parseUnits('1.25', 18))
      initialTotalSupply += 2
      await setInitialTotalSupply(seigManager.target.toString(), initialTotalSupply)
      await stake(candidateAddOn, owner)

      // update totalLayer2TVL to 1.25
      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()
      // distribute seigniorage to layer2
      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      expect(await layer2Manager.seigs(candidateAddOn)).to.be.eq(0)
      expect(await wton.balanceOf(layer2Manager)).to.be.eq(0)
    })

    it('should update layer2 TVL correctly', async () => {
      await layer2Manager.setStatusLayer2(rollupConfig, 1)
      await l1BridgeRegistry.setLayer2TVL(rollupConfig, ethers.parseUnits('1.25', 18))
      initialTotalSupply += 2
      await setInitialTotalSupply(seigManager.target.toString(), initialTotalSupply)
      await stake(candidateAddOn, owner)

      // update totalLayer2TVL to 1.25
      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()
      // distribute seigniorage to layer2
      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      expect(await layer2Manager.seigs(candidateAddOn)).to.be.eq(ethers.parseUnits('0.25', 27))
      expect(await wton.balanceOf(layer2Manager)).to.be.eq(ethers.parseUnits('0.25', 27))
    })

    it('should update layer2 TVL correctly when pausing', async () => {
      await layer2Manager.setStatusLayer2(rollupConfig, 1)
      await l1BridgeRegistry.setLayer2TVL(rollupConfig, ethers.parseUnits('1.25', 18))
      initialTotalSupply += 2
      await setInitialTotalSupply(seigManager.target.toString(), initialTotalSupply)
      await stake(candidateAddOn, owner)

      // update totalLayer2TVL to 1.25
      await seigManager.connect(candidateAddOnSigner).updateSeigniorage()

      // update totalLayer2TVL to 0
      await seigManager.connect(layer2ManagerSigner).excludeFromL2Seigniorage(candidateAddOn)

      expect(await seigManager.totalLayer2TVL()).to.be.eq(0)
    })
  })
})

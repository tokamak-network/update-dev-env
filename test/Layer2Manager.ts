import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { impersonateAccount, loadFixture, setBalance, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { getRandomAddresses } from '../utils'

describe('Layer2ManagerV1_1 Test', () => {
  let owner: HardhatEthersSigner
  let nonOwner: HardhatEthersSigner
  let layer2Manager: string
  let l1BridgeRegistry: string
  let operatorManagerFactory: string
  let ton: string
  let wton: string
  let dao: string
  let depositManager: string
  let seigManager: string
  let swapProxy: string

  const deployLayer2Manager = async () => {
    const layer2Manager = await ethers.deployContract('Layer2ManagerV1_1')
    const role = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const rolesStorageSlot = 5
    const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
    const outerSlot = ethers.keccak256(encodedOuter)
    const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [owner.address, BigInt(outerSlot)]
    )
    const memberSlot = ethers.keccak256(encodedMember)
    await setStorageAt(layer2Manager.target.toString(), memberSlot, ethers.zeroPadValue('0x01', 32))

    return { layer2Manager }
  }

  const initializeLayer2Manager = async () => {
    const { layer2Manager } = await loadFixture(deployLayer2Manager)

    const rollupConfig = await ethers.deployContract('RollupConfig')
    await rollupConfig.setOptimismPortal(ethers.Wallet.createRandom())
    await rollupConfig.setL1StandardBridge(ethers.Wallet.createRandom())

    const daoCommittee = await ethers.deployContract('MockDaoCommittee')
    const depositManager = await ethers.deployContract('MockDepositManager')
    const operatorManagerFactory = await ethers.deployContract('MockOperatorManagerFactory')
    const seigManager = await ethers.deployContract('MockSeigManager')
    const ton = await ethers.deployContract('MockTON')
    const wton = await ethers.deployContract('MockWTON', [ton.target])
    const l1BridgeRegistry = await ethers.deployContract('MockL1BridgeRegistryV1_1')

    await l1BridgeRegistry.setRollupInfo(rollupConfig, 1, ethers.Wallet.createRandom().address, false, false, 'test')
    await layer2Manager.setAddresses(
      l1BridgeRegistry,
      operatorManagerFactory,
      ton,
      wton,
      daoCommittee,
      depositManager,
      seigManager,
      swapProxy
    )

    return { l1BridgeRegistry, seigManager, rollupConfig, layer2Manager, ton, wton }
  }

  const registerCandidateAddOn = async () => {
    const { l1BridgeRegistry, seigManager, rollupConfig, layer2Manager, ton, wton } =
      await loadFixture(initializeLayer2Manager)
    await ton.mint(owner.address, 1)
    await ton.approve(layer2Manager.target, 1)
    await layer2Manager.setMinimumInitialDepositAmount(1)
    const receipt = await (await layer2Manager.registerCandidateAddOn(rollupConfig, 1, true, 'test')).wait()
    const registeredCandidateAddOnSignature = ethers.id(
      'RegisteredCandidateAddOn(address,uint256,string,address,address)'
    )
    const registeredCandidateAddOnEvent = receipt!.logs.find(
      (log) => log.topics[0] === registeredCandidateAddOnSignature
    )
    expect(registeredCandidateAddOnEvent).to.not.be.undefined

    const parsedRegisteredCandidateAddOnEvent = layer2Manager.interface.parseLog(registeredCandidateAddOnEvent!)
    return {
      l1BridgeRegistry,
      seigManager,
      rollupConfig,
      layer2Manager,
      ton,
      wton,
      operator: parsedRegisteredCandidateAddOnEvent?.args[3],
      candidateAddOn: parsedRegisteredCandidateAddOnEvent?.args[4]
    }
  }

  beforeEach(async () => {
    ;[owner, nonOwner] = await ethers.getSigners()
    ;[layer2Manager, l1BridgeRegistry, operatorManagerFactory, ton, wton, dao, depositManager, seigManager, swapProxy] =
      getRandomAddresses(9)
  })

  describe('Test for setAddresses', () => {
    it('should fail when non-owner tries to setAddresses', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await expect(
        layer2Manager
          .connect(nonOwner)
          .setAddresses(
            l1BridgeRegistry,
            operatorManagerFactory,
            ton,
            wton,
            dao,
            depositManager,
            seigManager,
            swapProxy
          )
      ).to.be.revertedWith('Accessible: Caller is not an admin')
    })

    it('should fail when tries to setAddresses twice', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await layer2Manager.setAddresses(
        l1BridgeRegistry,
        operatorManagerFactory,
        ton,
        wton,
        dao,
        depositManager,
        seigManager,
        swapProxy
      )

      await expect(
        layer2Manager.setAddresses(
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('already initialized')
    })

    it('setAddresses', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await layer2Manager.setAddresses(
        l1BridgeRegistry,
        operatorManagerFactory,
        ton,
        wton,
        dao,
        depositManager,
        seigManager,
        swapProxy
      )
    })
  })

  describe('Test for setOperatorManagerFactory', () => {
    it('should fail when non-owner tries to setOperatorManagerFactory', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await expect(
        layer2Manager.connect(nonOwner).setOperatorManagerFactory(operatorManagerFactory)
      ).to.be.revertedWith('Accessible: Caller is not an admin')
    })

    it('should fail when tries to setOperatorManagerFactory with same address', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await layer2Manager.setOperatorManagerFactory(operatorManagerFactory)
      await expect(layer2Manager.setOperatorManagerFactory(operatorManagerFactory)).to.be.revertedWith('same')
    })

    it('setOperatorManagerFactory', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await layer2Manager.setOperatorManagerFactory(operatorManagerFactory)
    })
  })

  describe('Test for setMinimumInitialDepositAmount', () => {
    it('should fail when non-owner tries to setMinimumInitialDepositAmount', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await expect(layer2Manager.connect(nonOwner).setMinimumInitialDepositAmount(100)).to.be.revertedWith(
        'Accessible: Caller is not an admin'
      )
    })

    it('should fail when tries to setMinimumInitialDepositAmount with same amount', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await layer2Manager.setMinimumInitialDepositAmount(100)
      await expect(layer2Manager.setMinimumInitialDepositAmount(100)).to.be.revertedWith('same')
    })

    it('setMinimumInitialDepositAmount', async () => {
      const { layer2Manager } = await loadFixture(deployLayer2Manager)
      await layer2Manager.setMinimumInitialDepositAmount(100)
    })
  })

  describe('Test for pauseCandidateAddOn', () => {
    it('should fail when non-L1BridgeRegistry tries to pauseCandidateAddOn', async () => {
      const { rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)
      await expect(layer2Manager.pauseCandidateAddOn(rollupConfig)).to.be.revertedWith(
        'sender is not a L1BridgeRegistry'
      )
    })

    it('should fail when CandidateAddOn is not registered', async () => {
      const { l1BridgeRegistry, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())

      await expect(
        layer2Manager.connect(l1BridgeRegistrySigner).pauseCandidateAddOn(ethers.Wallet.createRandom().address)
      ).to.be.revertedWithCustomError(layer2Manager, 'StatusError')
    })

    it('should fail when CandidateAddOn is already paused', async () => {
      const { l1BridgeRegistry, rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())
      await layer2Manager.connect(l1BridgeRegistrySigner).pauseCandidateAddOn(rollupConfig)

      await expect(
        layer2Manager.connect(l1BridgeRegistrySigner).pauseCandidateAddOn(rollupConfig)
      ).to.be.revertedWithCustomError(layer2Manager, 'StatusError')
    })

    it('pauseCandidateAddOn', async () => {
      const { l1BridgeRegistry, rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())
      await layer2Manager.connect(l1BridgeRegistrySigner).pauseCandidateAddOn(rollupConfig)
    })
  })

  describe('Test for unpauseCandidateAddOn', () => {
    it('should fail when non-L1BridgeRegistry tries to unpauseCandidateAddOn', async () => {
      const { rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await expect(layer2Manager.unpauseCandidateAddOn(rollupConfig)).to.be.revertedWith(
        'sender is not a L1BridgeRegistry'
      )
    })

    it('should fail when CandidateAddOn is not registered', async () => {
      const { l1BridgeRegistry, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())

      await expect(
        layer2Manager.connect(l1BridgeRegistrySigner).unpauseCandidateAddOn(ethers.Wallet.createRandom().address)
      ).to.be.revertedWithCustomError(layer2Manager, 'StatusError')
    })

    it('should fail when CandidateAddOn is not paused', async () => {
      const { l1BridgeRegistry, rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())
      await expect(
        layer2Manager.connect(l1BridgeRegistrySigner).unpauseCandidateAddOn(rollupConfig)
      ).to.be.revertedWithCustomError(layer2Manager, 'StatusError')
    })

    it('unpauseCandidateAddOn', async () => {
      const { l1BridgeRegistry, rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())
      await layer2Manager.connect(l1BridgeRegistrySigner).pauseCandidateAddOn(rollupConfig)
      await layer2Manager.connect(l1BridgeRegistrySigner).unpauseCandidateAddOn(rollupConfig)
    })
  })

  describe('Test for transferL2Seigniorage', () => {
    it('should fail non-SeigManager tries to transferL2Seigniorage', async () => {
      const { rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)
      await expect(layer2Manager.transferL2Seigniorage(rollupConfig, 1)).to.be.revertedWith(
        'sender is not a SeigManager'
      )
    })

    it('should fail when CandidateAddOn is not registered', async () => {
      const { seigManager, rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)
      await setBalance(seigManager.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(seigManager.target.toString())
      const seigManagerSigner = await ethers.getSigner(seigManager.target.toString())
      await expect(layer2Manager.connect(seigManagerSigner).transferL2Seigniorage(rollupConfig, 1)).to.be.revertedWith(
        'wrong operator'
      )
    })

    it('transferL2Seigniorage', async () => {
      const { rollupConfig, seigManager, layer2Manager, wton } = await loadFixture(registerCandidateAddOn)

      const operator = await layer2Manager.operatorOfRollupConfig(rollupConfig)
      const candidateAddOn = await layer2Manager.candidateAddOnOfOperator(operator)
      await wton.mint(layer2Manager, 1)

      await setBalance(seigManager.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(seigManager.target.toString())
      const seigManagerSigner = await ethers.getSigner(seigManager.target.toString())
      await layer2Manager.connect(seigManagerSigner).transferL2Seigniorage(candidateAddOn, 1)
      expect(await wton.balanceOf(operator)).to.equal(1)
    })
  })

  describe('Test for registerCandidateAddOn', () => {
    it('should fail when rollupConfig is zero address', async () => {
      const { layer2Manager } = await loadFixture(initializeLayer2Manager)
      await expect(
        layer2Manager.registerCandidateAddOn(ethers.ZeroAddress, 0, false, '')
      ).to.be.revertedWithCustomError(layer2Manager, 'ZeroAddressError')
    })

    it('should fail when memo is empty', async () => {
      const { layer2Manager } = await loadFixture(initializeLayer2Manager)
      await expect(
        layer2Manager.registerCandidateAddOn(ethers.Wallet.createRandom().address, 0, false, '')
      ).to.be.revertedWithCustomError(layer2Manager, 'ZeroBytesError')
    })

    it('should fail when rollupConfig is not registered', async () => {
      const { layer2Manager } = await loadFixture(initializeLayer2Manager)
      await expect(layer2Manager.registerCandidateAddOn(ethers.Wallet.createRandom().address, 0, false, 'test'))
        .to.be.revertedWithCustomError(layer2Manager, 'RegisterError')
        .withArgs(5)
    })

    it('should fail when amount is less than minimumInitialDepositAmount with TON', async () => {
      const { rollupConfig, layer2Manager } = await loadFixture(initializeLayer2Manager)
      await layer2Manager.setMinimumInitialDepositAmount(1)
      await expect(layer2Manager.registerCandidateAddOn(rollupConfig, 0, true, 'test'))
        .to.be.revertedWithCustomError(layer2Manager, 'RegisterError')
        .withArgs(6)
    })

    it('should fail when amount is less than minimumInitialDepositAmount with WTON', async () => {
      const { rollupConfig, layer2Manager } = await loadFixture(initializeLayer2Manager)
      await layer2Manager.setMinimumInitialDepositAmount(1)
      await expect(layer2Manager.registerCandidateAddOn(rollupConfig, 0, false, 'test'))
        .to.be.revertedWithCustomError(layer2Manager, 'RegisterError')
        .withArgs(6)
    })

    it('registerCandidateAddOn with TON', async () => {
      const { rollupConfig, layer2Manager, ton } = await loadFixture(initializeLayer2Manager)
      await ton.mint(owner.address, 1)
      await ton.approve(layer2Manager.target, 1)
      await layer2Manager.setMinimumInitialDepositAmount(1)
      await layer2Manager.registerCandidateAddOn(rollupConfig, 1, true, 'test')
    })

    it('registerCandidateAddOn with WTON', async () => {
      const { rollupConfig, layer2Manager, wton } = await loadFixture(initializeLayer2Manager)
      await wton.mint(owner.address, 1e9)
      await wton.approve(layer2Manager.target, 1e9)
      await layer2Manager.setMinimumInitialDepositAmount(1)
      await layer2Manager.registerCandidateAddOn(rollupConfig, 1e9, false, 'test')
    })
  })

  describe('Tests for onApprove', () => {
    it('should fail when non-TON or non-WTON tries to call onApprove', async () => {
      const { layer2Manager } = await loadFixture(initializeLayer2Manager)
      await expect(layer2Manager.onApprove(owner.address, owner.address, 1, '0x'))
        .to.be.revertedWithCustomError(layer2Manager, 'OnApproveError')
        .withArgs(1)
    })

    it('should fail when spender is not layer2Manager', async () => {
      const { layer2Manager, ton } = await loadFixture(initializeLayer2Manager)
      await setBalance(ton.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(ton.target.toString())
      const tonSigner = await ethers.getSigner(ton.target.toString())
      await expect(layer2Manager.connect(tonSigner).onApprove(owner, ethers.Wallet.createRandom(), 1, '0x'))
        .to.be.revertedWithCustomError(layer2Manager, 'OnApproveError')
        .withArgs(2)
    })

    it('should fail when data length is less than 20', async () => {
      const { layer2Manager, ton } = await loadFixture(initializeLayer2Manager)
      await setBalance(ton.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(ton.target.toString())
      const tonSigner = await ethers.getSigner(ton.target.toString())
      await expect(layer2Manager.connect(tonSigner).onApprove(owner.address, layer2Manager, 1, '0x'))
        .to.be.revertedWithCustomError(layer2Manager, 'OnApproveError')
        .withArgs(3)
    })

    it('should fail when rollupConfig is zero address', async () => {
      const { layer2Manager, ton } = await loadFixture(initializeLayer2Manager)
      const data = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'string'], [ethers.ZeroAddress, 'test'])

      await setBalance(ton.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(ton.target.toString())
      const tonSigner = await ethers.getSigner(ton.target.toString())
      await expect(
        layer2Manager.connect(tonSigner).onApprove(owner.address, layer2Manager, 1, data)
      ).to.be.revertedWithCustomError(layer2Manager, 'ZeroAddressError')
    })

    it('should fail when CandidateAddOn is already registered', async () => {
      const { rollupConfig, layer2Manager, ton } = await loadFixture(registerCandidateAddOn)

      const message = ethers.toUtf8Bytes('hello rollup')
      const data = ethers.concat([rollupConfig.target.toString(), message])

      await setBalance(ton.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(ton.target.toString())
      const tonSigner = await ethers.getSigner(ton.target.toString())
      await expect(layer2Manager.connect(tonSigner).onApprove(owner.address, layer2Manager, 1, data))
        .to.be.revertedWithCustomError(layer2Manager, 'RegisterError')
        .withArgs(4)
    })

    it('onApprove with TON', async () => {
      const { rollupConfig, layer2Manager, ton } = await loadFixture(initializeLayer2Manager)

      const message = ethers.toUtf8Bytes('hello rollup')
      const data = ethers.concat([rollupConfig.target.toString(), message])

      await ton.mint(owner.address, 1)
      await ton.approve(layer2Manager.target, 1)

      await setBalance(ton.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(ton.target.toString())
      const tonSigner = await ethers.getSigner(ton.target.toString())
      await layer2Manager.connect(tonSigner).onApprove(owner.address, layer2Manager, 1, data)
    })

    it('onApprove with WTON', async () => {
      const { rollupConfig, layer2Manager, wton } = await loadFixture(initializeLayer2Manager)

      const message = ethers.toUtf8Bytes('hello rollup')
      const data = ethers.concat([rollupConfig.target.toString(), message])

      await wton.mint(owner.address, 1)
      await wton.approve(layer2Manager.target, 1)

      await setBalance(wton.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(wton.target.toString())
      const wtonSigner = await ethers.getSigner(wton.target.toString())
      await layer2Manager.connect(wtonSigner).onApprove(owner.address, layer2Manager, 1, data)
    })
  })

  describe('Tests for availableRegister', () => {
    it('availableRegister with unregistered rollupConfig', async () => {
      const { layer2Manager } = await loadFixture(initializeLayer2Manager)

      const result = await layer2Manager.availableRegister(ethers.Wallet.createRandom())
      expect(result).to.equal(false)
    })
    it('availableRegister with rollupConfig(type 1)', async () => {
      const { l1BridgeRegistry, layer2Manager, ton } = await loadFixture(initializeLayer2Manager)
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await l1BridgeRegistry.setRollupInfo(rollupConfig, 1, ethers.Wallet.createRandom(), false, false, 'test')
      const result = await layer2Manager.availableRegister(rollupConfig)
      expect(result).to.equal(true)
    })
    it('availableRegister with rollupConfig(type 2)', async () => {
      const { l1BridgeRegistry, layer2Manager, ton } = await loadFixture(initializeLayer2Manager)
      const rollupConfig = await ethers.deployContract('RollupConfig')
      await l1BridgeRegistry.setRollupInfo(rollupConfig, 2, ethers.Wallet.createRandom(), false, false, 'test')
      const result = await layer2Manager.availableRegister(rollupConfig)
      expect(result).to.equal(true)
    })
  })

  describe('Tests for checkLayer2TVL', () => {
    it('checkLayer2TVL with unregistered rollupConfig', async () => {
      const { layer2Manager } = await loadFixture(initializeLayer2Manager)

      const [result, amount] = await layer2Manager.checkLayer2TVL(ethers.Wallet.createRandom())
      expect(result).to.equal(false)
      expect(amount).to.equal(0)
    })

    it('checkLayer2TVL with rollupConfig(type 1)', async () => {
      const { l1BridgeRegistry, layer2Manager, ton } = await loadFixture(initializeLayer2Manager)

      const l1StandardBridge = ethers.Wallet.createRandom()
      await ton.mint(l1StandardBridge, 1)

      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setL1StandardBridge(l1StandardBridge)
      await l1BridgeRegistry.setRollupInfo(rollupConfig, 1, ethers.Wallet.createRandom(), false, false, 'test')

      const [result, amount] = await layer2Manager.checkLayer2TVL(rollupConfig)
      expect(result).to.equal(true)
      expect(amount).to.equal(1)
    })

    it('checkLayer2TVL with rollupConfig(type 2)', async () => {
      const { l1BridgeRegistry, layer2Manager, ton } = await loadFixture(initializeLayer2Manager)

      const optimismPortal = ethers.Wallet.createRandom()
      await ton.mint(optimismPortal, 1)

      const rollupConfig = await ethers.deployContract('RollupConfig')
      await rollupConfig.setOptimismPortal(optimismPortal)
      await l1BridgeRegistry.setRollupInfo(rollupConfig, 2, ethers.Wallet.createRandom(), false, false, 'test')

      const [result, amount] = await layer2Manager.checkLayer2TVL(rollupConfig)
      expect(result).to.equal(true)
      expect(amount).to.equal(1)
    })
  })

  describe('Tests for view methods', () => {
    it('layerInfo', async () => {
      const { rollupConfig, layer2Manager, operator, candidateAddOn } = await loadFixture(registerCandidateAddOn)
      const [rollupConfig_, operator_] = await layer2Manager.layerInfo(candidateAddOn)
      expect(rollupConfig_).to.equal(rollupConfig)
      expect(operator_).to.equal(operator)
    })

    it('rollupConfigOfOperator', async () => {
      const { rollupConfig, layer2Manager, operator } = await loadFixture(registerCandidateAddOn)
      const rollupConfig_ = await layer2Manager.rollupConfigOfOperator(operator)
      expect(rollupConfig_).to.equal(rollupConfig)

      const rollupConfig__ = await layer2Manager.rollupConfigOfOperator(ethers.Wallet.createRandom())
      expect(rollupConfig__).to.equal(ethers.ZeroAddress)
    })

    it('operatorOfRollupConfig', async () => {
      const { rollupConfig, layer2Manager, operator } = await loadFixture(registerCandidateAddOn)
      const operator_ = await layer2Manager.operatorOfRollupConfig(rollupConfig)
      expect(operator_).to.equal(operator)

      const operator__ = await layer2Manager.operatorOfRollupConfig(ethers.Wallet.createRandom())
      expect(operator__).to.equal(ethers.ZeroAddress)
    })

    it('candidateAddOnOfOperator', async () => {
      const { layer2Manager, operator, candidateAddOn } = await loadFixture(registerCandidateAddOn)
      const candidateAddOn_ = await layer2Manager.candidateAddOnOfOperator(operator)
      expect(candidateAddOn_).to.equal(candidateAddOn)

      const candidateAddOn__ = await layer2Manager.candidateAddOnOfOperator(ethers.Wallet.createRandom())
      expect(candidateAddOn__).to.equal(ethers.ZeroAddress)
    })

    it('statusLayer2', async () => {
      const { l1BridgeRegistry, rollupConfig, layer2Manager } = await loadFixture(registerCandidateAddOn)
      const status = await layer2Manager.statusLayer2(rollupConfig)
      expect(status).to.equal(1)

      const status_ = await layer2Manager.statusLayer2(ethers.Wallet.createRandom())
      expect(status_).to.equal(0)

      await setBalance(l1BridgeRegistry.target.toString(), ethers.parseEther('1'))
      await impersonateAccount(l1BridgeRegistry.target.toString())
      const l1BridgeRegistrySigner = await ethers.getSigner(l1BridgeRegistry.target.toString())
      await layer2Manager.connect(l1BridgeRegistrySigner).pauseCandidateAddOn(rollupConfig)

      const status__ = await layer2Manager.statusLayer2(rollupConfig)
      expect(status__).to.equal(2)
    })

    it('verifyOperator', async () => {
      const { rollupConfig, layer2Manager, operator, candidateAddOn } = await loadFixture(registerCandidateAddOn)
      const result = await layer2Manager.verifyOperator(candidateAddOn, rollupConfig, operator)
      expect(result).to.equal(true)

      const result_ = await layer2Manager.verifyOperator(ethers.Wallet.createRandom(), rollupConfig, operator)
      expect(result_).to.equal(false)

      const result__ = await layer2Manager.verifyOperator(candidateAddOn, ethers.Wallet.createRandom(), operator)
      expect(result__).to.equal(false)

      const result___ = await layer2Manager.verifyOperator(candidateAddOn, rollupConfig, ethers.Wallet.createRandom())
      expect(result___).to.equal(false)
    })

    it('checkL1BridgeDetail', async () => {
      const { l1BridgeRegistry, rollupConfig, layer2Manager } = await loadFixture(initializeLayer2Manager)
      l1BridgeRegistry.setRollupInfo(rollupConfig, 1, ethers.Wallet.createRandom(), false, false, 'test')
      const [result, l1Bridge, portal, l2Ton, type, status] = await layer2Manager.checkL1BridgeDetail(rollupConfig)
    })
  })
})

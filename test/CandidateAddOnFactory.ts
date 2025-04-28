import { loadFixture, setBalance, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('CandidateAddOnFactory', () => {
  const deployCandidateAddOnFactory = async () => {
    const [owner] = await ethers.getSigners()

    const candidateAddOnFactory = await ethers.deployContract('CandidateAddOnFactory')

    const role = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const rolesStorageSlot = 5
    const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
    const outerSlot = ethers.keccak256(encodedOuter)
    const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [owner.address, BigInt(outerSlot)]
    )
    const memberSlot = ethers.keccak256(encodedMember)
    await setStorageAt(candidateAddOnFactory.target.toString(), memberSlot, ethers.zeroPadValue('0x01', 32))

    return candidateAddOnFactory
  }

  describe('Tests for setAddress', () => {
    it('should fail when non-owner tries to setAddress', async () => {
      const [, nonOwner] = await ethers.getSigners()
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory
          .connect(nonOwner)
          .setAddress(
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address
          )
      ).to.be.revertedWith('Accessible: Caller is not an admin')
    })

    it('should fail when _depositManager is zero address', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.setAddress(
          ethers.ZeroAddress,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('zero')
    })

    it('should fail when _daoCommittee is zero address', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.setAddress(
          ethers.Wallet.createRandom().address,
          ethers.ZeroAddress,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('zero')
    })

    it('should fail when _candidateAddOnImp is zero address', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.setAddress(
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.ZeroAddress,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('zero')
    })

    it('should fail when _ton is zero address', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.setAddress(
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.ZeroAddress,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('zero')
    })

    it('should fail when _wton is zero address', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.setAddress(
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.ZeroAddress,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('zero')
    })

    it('should fail when _onDemandL1BridgeRegistry is zero address', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.setAddress(
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith('zero')
    })

    it('should fail when setAddress is called twice with same addresses', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)

      const depositManager = ethers.Wallet.createRandom().address
      const daoCommittee = ethers.Wallet.createRandom().address
      const candidateAddOnImp = ethers.Wallet.createRandom().address
      const ton = ethers.Wallet.createRandom().address
      const wton = ethers.Wallet.createRandom().address
      const onDemandL1BridgeRegistry = ethers.Wallet.createRandom().address

      await candidateAddOnFactory.setAddress(
        depositManager,
        daoCommittee,
        candidateAddOnImp,
        ton,
        wton,
        onDemandL1BridgeRegistry
      )

      await expect(
        candidateAddOnFactory.setAddress(
          depositManager,
          daoCommittee,
          candidateAddOnImp,
          ton,
          wton,
          onDemandL1BridgeRegistry
        )
      ).to.be.revertedWith('same')
    })

    it('setAddress', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)

      const depositManager = ethers.Wallet.createRandom().address
      const daoCommittee = ethers.Wallet.createRandom().address
      const candidateAddOnImp = ethers.Wallet.createRandom().address
      const ton = ethers.Wallet.createRandom().address
      const wton = ethers.Wallet.createRandom().address
      const onDemandL1BridgeRegistry = ethers.Wallet.createRandom().address

      await candidateAddOnFactory.setAddress(
        depositManager,
        daoCommittee,
        candidateAddOnImp,
        ton,
        wton,
        onDemandL1BridgeRegistry
      )
    })
  })

  describe('Tests for deploy', () => {
    it('should fail when non-daoCommittee tries to deploy', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)
      await expect(
        candidateAddOnFactory.deploy(
          ethers.Wallet.createRandom().address,
          'TEST',
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith('sender is not daoCommittee')
    })

    it('should fail when daoCommittee is different', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)

      const daoCommittee = ethers.Wallet.createRandom(ethers.provider)
      await candidateAddOnFactory.setAddress(
        ethers.Wallet.createRandom().address,
        daoCommittee.address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address
      )

      await expect(
        candidateAddOnFactory
          .connect(daoCommittee)
          .deploy(
            ethers.Wallet.createRandom().address,
            'TEST',
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address
          )
      ).to.be.revertedWith('different daoCommittee')
    })

    it('deploy', async () => {
      const candidateAddOnFactory = await loadFixture(deployCandidateAddOnFactory)

      const candidateAddOnImp = await ethers.deployContract('MockCandidateAddOn')
      const daoCommittee = ethers.Wallet.createRandom(ethers.provider)
      await candidateAddOnFactory.setAddress(
        ethers.Wallet.createRandom().address,
        daoCommittee.address,
        candidateAddOnImp,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address
      )

      await setBalance(daoCommittee.address, ethers.parseEther('1'))

      const memo = 'TEST'
      const sender = ethers.Wallet.createRandom()
      const seigManager = ethers.Wallet.createRandom()

      const tx = await candidateAddOnFactory
        .connect(daoCommittee)
        .deploy(sender, memo, daoCommittee.address, seigManager)
      const receipt = (await tx.wait())!
      const initializedEventSignature = ethers.id('Initialized(address,string,address,address)')
      expect(receipt.logs[3].topics[0]).to.equal(initializedEventSignature)
    })
  })
})

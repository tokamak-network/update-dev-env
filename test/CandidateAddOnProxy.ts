import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { getRandomAddresses } from '@utils'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('CandidateAddOnProxy', () => {
  let owner: HardhatEthersSigner
  let nonOwner: HardhatEthersSigner

  const deployCandidateAddOn = async () => {
    const candidateAddOnProxy = await ethers.deployContract('CandidateAddOnProxy')
    const implementation = await ethers.deployContract('CandidateAddOnV1_1')
    await candidateAddOnProxy.upgradeTo(implementation.target)
    const candidateAddOn = await ethers.getContractAt('CandidateAddOnV1_1', candidateAddOnProxy.target)
    return { candidateAddOn }
  }

  beforeEach(async () => {
    ;[owner, nonOwner] = await ethers.getSigners()
  })

  describe('Tests for initialize', () => {
    it('initialize', async () => {
      const { candidateAddOn } = await loadFixture(deployCandidateAddOn)
      const [daoCommittee, seigManager, ton, wton] = getRandomAddresses(4)
      const operatorManager = await ethers.deployContract('MockOperatorManager')
      await operatorManager.setRollupConfig(ethers.Wallet.createRandom().address)

      await candidateAddOn.initialize(operatorManager, 'test', daoCommittee, seigManager, ton, wton)

      expect(await candidateAddOn.candidate()).to.equal(operatorManager.target)
      expect(await candidateAddOn.committee()).to.equal(daoCommittee)
      expect(await candidateAddOn.seigManager()).to.equal(seigManager)
      expect(await candidateAddOn.ton()).to.equal(ton)
      expect(await candidateAddOn.wton()).to.equal(wton)
    })
  })
})

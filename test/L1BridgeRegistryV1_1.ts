import { ethers, network, getNamedAccounts } from 'hardhat'
import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import type { OperatorManagerFactory, OperatorManagerV1_1 } from '../typechain-types'
import type { Addressable } from 'ethers'

const fundingETH = (address: string | Addressable, amount = 100) =>
  network.provider.send('hardhat_setBalance', [address, `0x${ethers.parseEther(amount.toString()).toString(16)}`])

describe('L1BridgeRegistryV1_1(without Proxy Contract)', () => {
  describe('Tests for Contract Deployment', () => {
    it('should set owner', async () => {
      //   const [owner] = await ethers.getSigners()

      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [ethers.ZeroAddress]
      })
      const owner = await ethers.getSigner(ethers.ZeroAddress)
      const bridgeRegistry = await ethers.deployContract('L1BridgeRegistryV1_1')

      console.log(await bridgeRegistry.connect(owner).isOwner())
      //   console.log(await bridgeRegistry.isAdmin(ethers.ZeroAddress))
      //   console.log(await bridgeRegistry.isManager(owner.address))
      //   expect(await bridgeRegistry.connect(owner).isAdmin(owner.address)).to.be.equal(true)
    })
  })
})

import type { AutoRefactorCoinage } from '@contracts/stake/tokens/AutoRefactorCoinage'
import { AutoRefactorCoinage__factory } from '@factories/stake/tokens/AutoRefactorCoinage__factory'
import { setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'

describe('AutoRefactorCoinage', () => {
  let autoRefactorCoinage: AutoRefactorCoinage

  describe('initialize', () => {
    it('should initialize', async () => {
      const [owner, holder] = await ethers.getSigners()
      const factory = new AutoRefactorCoinage__factory().connect(owner)
      autoRefactorCoinage = await factory.deploy()

      const role = '0x0000000000000000000000000000000000000000000000000000000000000000'

      const rolesStorageSlot = 5
      const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
      const outerSlot = ethers.keccak256(encodedOuter)

      const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [owner.address, BigInt(outerSlot)]
      )
      const memberSlot = ethers.keccak256(encodedMember)

      await setStorageAt(autoRefactorCoinage.target.toString(), memberSlot, ethers.zeroPadValue('0x01', 32))
      await autoRefactorCoinage.initialize('TEST', 'TEST', ethers.parseUnits('0.9', 27), ethers.ZeroAddress)

      await autoRefactorCoinage.addMinter(owner)

      await autoRefactorCoinage.mint(holder, ethers.parseUnits('1', 27))
      console.log(await autoRefactorCoinage.balanceOf(holder))
    })
  })
})

import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import type { Addressable } from 'ethers'
import { ethers } from 'ethers'

export async function setAdmin(contract: string | Addressable, admin: HardhatEthersSigner) {
  const role = '0x0000000000000000000000000000000000000000000000000000000000000000'
  const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, 1])
  const outerSlot = ethers.keccak256(encodedOuter)
  const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256'],
    [admin.address, BigInt(outerSlot)]
  )
  const memberSlot = ethers.keccak256(encodedMember)
  await setStorageAt(contract as string, memberSlot, ethers.zeroPadValue('0x01', 32))
}

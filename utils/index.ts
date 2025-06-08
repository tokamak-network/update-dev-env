import { impersonateAccount, setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import {
  setBurntAmountAtDAO,
  setCoinage,
  setCommissionRate,
  setDAO,
  setDAOSeigRate,
  setDelayedCommissionBlock,
  setDelayedCommissionRate,
  setDelayedCommissionRateNgative,
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
} from '@utils/seigManager'
import type { Addressable } from 'ethers'
import { ethers, network } from 'hardhat'

const getRandomAddresses = (count: number) => Array.from({ length: count }, () => ethers.Wallet.createRandom().address)

const grantAdminRole = async (contract: string, owner: string) => {
  const role = '0x0000000000000000000000000000000000000000000000000000000000000000'

  // AccessControl's _roles storage slot
  const rolesStorageSlot = 5
  const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
  const outerSlot = ethers.keccak256(encodedOuter)

  // RoleData's members storage slot
  const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [owner, BigInt(outerSlot)])
  const memberSlot = ethers.keccak256(encodedMember)

  await setStorageAt(contract, memberSlot, ethers.zeroPadValue('0x01', 32))
}

const grantPauseRole = async (contract: string, owner: string) => {
  const role = '0xfcb9fcbfa83b897fb2d5cf4b58962164105c1e71489a37ef3ae0db3fdce576f6'

  // AccessControl's _roles storage slot
  const rolesStorageSlot = 5
  const encodedOuter = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256'], [role, rolesStorageSlot])
  const outerSlot = ethers.keccak256(encodedOuter)

  // RoleData's members storage slot
  const encodedMember = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [owner, BigInt(outerSlot)])
  const memberSlot = ethers.keccak256(encodedMember)

  await setStorageAt(contract, memberSlot, ethers.zeroPadValue('0x01', 32))
}

const funding = (address: string | Addressable, amount = 100) =>
  network.provider.send('hardhat_setBalance', [address, `0x${ethers.parseEther(amount.toString()).toString(16)}`])

const impersonate = async (address: string) => {
  await impersonateAccount(address)
  return ethers.getSigner(address)
}

export {
  funding,
  getRandomAddresses,
  grantAdminRole,
  impersonate,
  setCoinage,
  setMinimumAmount,
  setTotalCoinage,
  setSeigPerBlock,
  setLastSeigBlock,
  setTON,
  setWTON,
  setSeigStartBlock,
  setInitialTotalSupply,
  setBurntAmountAtDAO,
  setPowerTON,
  setDAO,
  setPowerTONSeigRate,
  setDAOSeigRate,
  setDelayedCommissionBlock,
  setDelayedCommissionRate,
  setDelayedCommissionRateNgative,
  setDepositManager,
  setCommissionRate,
  setIsCommissionRateNegative,
  grantPauseRole
}

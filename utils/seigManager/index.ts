import { setStorageAt } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'

const DEPOSIT_MANAGER_SLOT = 7
const POWERTON_SLOT = 8
const DAO_SLOT = 9
const TON_SLOT = 10
const WTON_SLOT = 11
const TOTAL_COINAGE_SLOT = 13
const COINAGE_SLOT = 14
const SEIG_PER_BLOCK_SLOT = 16
const LAST_SEIG_BLOCK_SLOT = 17
const PAUSED_BLOCK_SLOT = 18
const UNPAUSED_BLOCK_SLOT = 19
const COMMISSION_RATES_SLOT = 20
const IS_COMMISSION_RATE_NEGATIVE_SLOT = 21
const ADJUST_COMMISSION_DELAY_SLOT = 22
const DELAYED_COMMISSION_BLOCK_SLOT = 23
const DELAYED_COMMISSION_RATE_SLOT = 24
const DELAYED_COMMISSION_RATE_NEGATIVE_SLOT = 25
const MINIMUM_AMOUNT_SLOT = 26
const POWER_TON_SEIG_RATE_SLOT = 27
const DAO_SEIG_RATE_SLOT = 28
const SEIG_START_BLOCK_SLOT = 33
const INITIAL_TOTAL_SUPPLY_SLOT = 34
const BURNT_AMOUNT_AT_DAO_SLOT = 35

const setCommissionRate = async (contract: string, layer2: string, rate: number) => {
  const slot = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [layer2, COMMISSION_RATES_SLOT])
  await setStorageAt(
    contract,
    ethers.keccak256(slot),
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(rate.toString(), 27))), 32)
  )
}

const setIsCommissionRateNegative = async (contract: string, layer2: string, isNegative: boolean) => {
  const slot = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256'],
    [layer2, IS_COMMISSION_RATE_NEGATIVE_SLOT]
  )
  await setStorageAt(
    contract,
    ethers.keccak256(slot),
    isNegative
      ? ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(1)), 32)
      : ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(0)), 32)
  )
}

const setDelayedCommissionBlock = async (contract: string, layer2: string, blockNumber: number) => {
  const slot = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [layer2, DELAYED_COMMISSION_BLOCK_SLOT])
  await setStorageAt(
    contract,
    ethers.keccak256(slot),
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(blockNumber)), 32)
  )
}

const setDelayedCommissionRate = async (contract: string, layer2: string, rate: number) => {
  const slot = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [layer2, DELAYED_COMMISSION_RATE_SLOT])
  await setStorageAt(
    contract,
    ethers.keccak256(slot),
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(rate.toString(), 27))), 32)
  )
}

const setDelayedCommissionRateNgative = async (contract: string, layer2: string, isNegative: boolean) => {
  const slot = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256'], // bool이 아닌 uint256으로 수정
    [layer2, DELAYED_COMMISSION_RATE_NEGATIVE_SLOT]
  )
  await setStorageAt(
    contract,
    ethers.keccak256(slot),
    isNegative
      ? ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(1)), 32)
      : ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(0)), 32)
  )
}

const setMinimumAmount = async (contract: string, amount: number) => {
  await setStorageAt(
    contract,
    MINIMUM_AMOUNT_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(amount.toString(), 27))), 32)
  )
}

const setSeigPerBlock = async (contract: string, amount: number) => {
  await setStorageAt(
    contract,
    SEIG_PER_BLOCK_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(amount.toString(), 27))), 32)
  )
}

const setLastSeigBlock = async (contract: string, blockNumber: number) => {
  await setStorageAt(
    contract,
    LAST_SEIG_BLOCK_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(blockNumber)), 32)
  )
}

const setCoinage = async (contract: string, address: string, coinage: string) => {
  const coinageSlot = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [address, COINAGE_SLOT])
  await setStorageAt(contract, ethers.keccak256(coinageSlot), coinage)
}

const setTotalCoinage = async (contract: string, address: string, coinage: string) => {
  await setStorageAt(contract, TOTAL_COINAGE_SLOT, coinage)
}

const setTON = async (contract: string, address: string) => {
  await setStorageAt(contract, TON_SLOT, ethers.zeroPadValue(address, 32))
}

const setWTON = async (contract: string, address: string) => {
  await setStorageAt(contract, WTON_SLOT, ethers.zeroPadValue(address, 32))
}

const setDepositManager = async (contract: string, address: string) => {
  await setStorageAt(contract, DEPOSIT_MANAGER_SLOT, ethers.zeroPadValue(address, 32))
}

const setPowerTON = async (contract: string, address: string) => {
  await setStorageAt(contract, POWERTON_SLOT, ethers.zeroPadValue(address, 32))
}

const setDAO = async (contract: string, address: string) => {
  await setStorageAt(contract, DAO_SLOT, ethers.zeroPadValue(address, 32))
}

const setPowerTONSeigRate = async (contract: string, rate: number) => {
  await setStorageAt(
    contract,
    POWER_TON_SEIG_RATE_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(rate.toString(), 27))), 32)
  )
}

const setDAOSeigRate = async (contract: string, rate: number) => {
  await setStorageAt(
    contract,
    DAO_SEIG_RATE_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(rate.toString(), 27))), 32)
  )
}

const setSeigStartBlock = async (contract: string, blockNumber: number) => {
  await setStorageAt(
    contract,
    SEIG_START_BLOCK_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(blockNumber)), 32)
  )
}

const setInitialTotalSupply = async (contract: string, amount: number) => {
  await setStorageAt(
    contract,
    INITIAL_TOTAL_SUPPLY_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(amount.toString(), 27))), 32)
  )
}

const setBurntAmountAtDAO = async (contract: string, amount: number) => {
  await setStorageAt(
    contract,
    BURNT_AMOUNT_AT_DAO_SLOT,
    ethers.zeroPadValue(ethers.hexlify(ethers.toBeHex(ethers.parseUnits(amount.toString(), 27))), 32)
  )
}

export {
  setMinimumAmount,
  setCoinage,
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
  setIsCommissionRateNegative
}

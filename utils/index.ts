import type { Addressable } from 'ethers'
import { ethers, network } from 'hardhat'

const funding = (address: string | Addressable, amount = 100) =>
  network.provider.send('hardhat_setBalance', [address, `0x${ethers.parseEther(amount.toString()).toString(16)}`])

const impersonate = async (address: string) => {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  })
  return ethers.getSigner(address)
}

export { funding, impersonate }

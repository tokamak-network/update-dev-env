// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockCoinage {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    function setTotalSupply(uint256 _totalSupply) external {
        totalSupply = _totalSupply;
    }

    function setBalanceOf(address _address, uint256 _balance) external {
        balanceOf[_address] = _balance;
    }
}

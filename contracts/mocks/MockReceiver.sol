// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockReceiver {
    receive() external payable {
        revert("not allowed");
    }
}

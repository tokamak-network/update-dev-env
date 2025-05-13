// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockERC20 is ERC20 {
    using SafeERC20 for ERC20;

    constructor() ERC20("MockERC20", "MCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

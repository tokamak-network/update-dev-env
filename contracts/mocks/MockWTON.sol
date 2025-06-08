// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockWTON is ERC20 {
    using SafeERC20 for ERC20;

    address public immutable ton;

    constructor(address _ton) ERC20("MockWTON", "WTON") {
        ton = _ton;
    }

    function mint(address to, uint256 amount) external returns (bool) {
        _mint(to, amount);
        return true;
    }

    function swapFromTON(uint256 amount) external returns (bool) {
        IERC20(ton).transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
        return true;
    }
}

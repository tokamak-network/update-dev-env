// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {DSMath} from "../libraries/DSMath.sol";

contract MockCoinage is DSMath {
    struct Balance {
        uint256 balance;
        uint256 refactoredCount;
        uint256 remain;
    }

    uint256 public constant REFACTOR_BOUNDARY = 10 ** 28;
    uint256 public constant REFACTOR_DIVIDER = 2;

    uint256 public refactorCount;

    mapping(address => Balance) public balances;

    Balance public _totalSupply;

    uint256 public _factor;

    event FactorSet(uint256 previous, uint256 current, uint256 shiftCount);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event ChangedBalance(address indexed account, uint256 balance, uint256 refactoredCount);

    function setFactor(uint256 factor_) external returns (bool) {
        uint256 previous = _factor;

        uint256 count = 0;
        uint256 f = factor_;

        for (; f >= REFACTOR_BOUNDARY; f = f / REFACTOR_DIVIDER) {
            count++;
        }

        refactorCount = count;
        _factor = f;

        emit FactorSet(previous, f, count);
        return true;
    }

    function mint(address account, uint256 amount) public returns (bool) {
        _mint(account, amount);
        return true;
    }

    function burnFrom(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function decimals() external pure returns (uint8) {
        return 27;
    }

    function totalSupply() external view returns (uint256) {
        return _applyFactor(_totalSupply.balance, _totalSupply.refactoredCount) + _totalSupply.remain;
    }

    function factor() public view returns (uint256) {
        return _factor * REFACTOR_DIVIDER ** refactorCount;
    }

    function balanceOf(address account) public view returns (uint256) {
        Balance storage b = balances[account];

        return _applyFactor(b.balance, b.refactoredCount) + b.remain;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "AutoRefactorCoinage: mint to the zero address");
        Balance storage b = balances[account];

        uint256 currentBalance = balanceOf(account);
        uint256 newBalance = currentBalance + amount;

        uint256 rbAmount = _toRAYBased(newBalance);
        b.balance = rbAmount;
        b.refactoredCount = refactorCount;

        addTotalSupply(amount);

        emit ChangedBalance(account, rbAmount, refactorCount);

        emit Transfer(address(0), account, _toRAYFactored(rbAmount));
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "AutoRefactorCoinage: burn from the zero address");
        Balance storage b = balances[account];

        uint256 currentBalance = balanceOf(account);
        uint256 newBalance = currentBalance - amount;

        uint256 rbAmount = _toRAYBased(newBalance);

        b.balance = rbAmount;
        b.refactoredCount = refactorCount;

        subTotalSupply(amount);

        emit ChangedBalance(account, rbAmount, refactorCount);

        emit Transfer(account, address(0), _toRAYFactored(rbAmount));
    }

    function _applyFactor(uint256 v, uint256 refactoredCount) internal view returns (uint256) {
        if (v == 0) {
            return 0;
        }
        v = rmul2(v, _factor);
        if (refactorCount > refactoredCount) {
            v = v * REFACTOR_DIVIDER ** (refactorCount - refactoredCount);
        }
        return v;
    }

    function _toRAYBased(uint256 rf) internal view returns (uint256 rb) {
        return rdiv2(rf, _factor);
    }

    function _toRAYFactored(uint256 rb) internal view returns (uint256 rf) {
        return rmul2(rb, _factor);
    }

    function addTotalSupply(uint256 amount) internal {
        uint256 currentSupply = _applyFactor(_totalSupply.balance, _totalSupply.refactoredCount);
        uint256 newSupply = currentSupply + amount;

        uint256 rbAmount = _toRAYBased(newSupply);
        _totalSupply.balance = rbAmount;
        _totalSupply.refactoredCount = refactorCount;

        emit ChangedBalance(address(0), rbAmount, refactorCount);
    }

    function subTotalSupply(uint256 amount) internal {
        uint256 currentSupply = _applyFactor(_totalSupply.balance, _totalSupply.refactoredCount);
        uint256 newSupply = currentSupply - amount;

        uint256 rbAmount = _toRAYBased(newSupply);
        _totalSupply.balance = rbAmount;
        _totalSupply.refactoredCount = refactorCount;

        emit ChangedBalance(address(0), rbAmount, refactorCount);
    }
}

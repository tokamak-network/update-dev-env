// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockOperatorManager {
    address public rollupConfig;
    address public operator;

    function setOperator(address _operator) external {
        operator = _operator;
    }

    function setRollupConfig(address _rollupConfig) external {
        rollupConfig = _rollupConfig;
    }

    function isOperator(address _operator) external view returns (bool) {
        return operator == _operator;
    }
}

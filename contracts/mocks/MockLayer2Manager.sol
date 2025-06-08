// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "hardhat/console.sol";

contract MockLayer2Manager {
    mapping(address => address) public _candidateAddOnOfOperator;
    mapping(address layer2 => address rollupConfig) public rollupConfigs;
    mapping(address rollupConfig => uint8) public statusLayer2;
    mapping(address layer2 => uint256 seig) public seigs;

    function setRollupConfig(address layer2, address rollupConfig) external {
        rollupConfigs[layer2] = rollupConfig;
    }

    function setStatusLayer2(address rollupConfig, uint8 status) external {
        statusLayer2[rollupConfig] = status;
    }

    function setCandidateAddOnOfOperator(address operator, address candidate) external {
        _candidateAddOnOfOperator[operator] = candidate;
    }

    function candidateAddOnOfOperator(address operator) external view returns (address) {
        return _candidateAddOnOfOperator[operator];
    }

    function layerInfo(address layer2) external view returns (address rollupConfig, address operator) {
        return (rollupConfigs[layer2], address(0));
    }

    function transferL2Seigniorage(address layer2, uint256 amount) external {
        seigs[layer2] += amount;
    }
}

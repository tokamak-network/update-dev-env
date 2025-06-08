// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OperatorManagerV1_1} from "../layer2/OperatorManagerV1_1.sol";

contract MockOperatorManagerFactory {
    function createOperatorManager(address _rollupConfig) external returns (address) {
        return address(new OperatorManagerV1_1());
    }
}

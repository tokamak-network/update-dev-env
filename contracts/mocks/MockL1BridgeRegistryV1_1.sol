// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import {L1BridgeRegistryV1_1} from "../layer2/L1BridgeRegistryV1_1.sol";

contract MockL1BridgeRegistryV1_1 is L1BridgeRegistryV1_1 {
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(REGISTRANT_ROLE, DEFAULT_ADMIN_ROLE);
    }
}

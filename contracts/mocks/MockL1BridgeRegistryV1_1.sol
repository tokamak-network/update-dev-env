//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockL1BridgeRegistryV1_1 {
    struct RollupInfo {
        uint8 rollupType;
        address l2TON;
        bool rejectedSeigs;
        bool rejectedL2Deposit;
        string name;
    }
    mapping(address => RollupInfo) public rollupInfo;

    function setRollupInfo(
        address rollupConfig,
        uint8 rollupType,
        address l2TON,
        bool rejectedSeigs,
        bool rejectedL2Deposit,
        string memory name
    ) external {
        rollupInfo[rollupConfig] = RollupInfo(
            rollupType,
            l2TON,
            rejectedSeigs,
            rejectedL2Deposit,
            name
        );
    }

    function rollupType(address rollupConfig) external view returns (uint8) {
        return rollupInfo[rollupConfig].rollupType;
    }

    function getRollupInfo(
        address rollupConfig
    )
        external
        view
        returns (
            uint8 type_,
            address l2TON_,
            bool rejectedSeigs_,
            bool rejectedL2Deposit_,
            string memory name_
        )
    {
        return (
            rollupInfo[rollupConfig].rollupType,
            rollupInfo[rollupConfig].l2TON,
            rollupInfo[rollupConfig].rejectedSeigs,
            rollupInfo[rollupConfig].rejectedL2Deposit,
            rollupInfo[rollupConfig].name
        );
    }

    function l2TON(address rollupConfig) external view returns (address) {
        return rollupInfo[rollupConfig].l2TON;
    }
}

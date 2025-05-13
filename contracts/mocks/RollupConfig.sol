// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RollupConfig {
    address public l1StandardBridge;
    address public optimismPortal;
    address public unsafeBlockSigner;

    function setUnsafeBlockSigner(address _unsafeBlockSigner) public {
        unsafeBlockSigner = _unsafeBlockSigner;
    }

    function setL1StandardBridge(address l1StandardBridge_) public {
        l1StandardBridge = l1StandardBridge_;
    }

    function setOptimismPortal(address optimismPortal_) public {
        optimismPortal = optimismPortal_;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

contract RollupConfig {
    address public unsafeBlockSigner;

    function setUnsafeBlockSigner(address _unsafeBlockSigner) public {
        unsafeBlockSigner = _unsafeBlockSigner;
    }
}

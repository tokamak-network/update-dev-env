// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICandidate} from "../dao/interfaces/ICandidate.sol";
import "hardhat/console.sol";

contract MockCandidateAddOn {
    event Initialized(
        address _operateContract,
        string memo,
        address committee,
        address seigManager
    );

    function initialize(
        address _operateContract,
        string memory _memo,
        address _committee,
        address _seigManager,
        address _ton,
        address _wton
    ) external {
        emit Initialized(_operateContract, _memo, _committee, _seigManager);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICandidate} from "../dao/interfaces/ICandidate.sol";

contract MockCandidateAddOn {
    event Initialized(address _operatorContract, string memo, address committee, address seigManager);
    event UpdateSeigniorage();

    address public operator;

    function initialize(
        address _operatorContract,
        string memory _memo,
        address _committee,
        address _seigManager,
        address _ton,
        address _wton
    ) external {
        emit Initialized(_operatorContract, _memo, _committee, _seigManager);
    }

    function updateSeigniorage() external returns (bool) {
        emit UpdateSeigniorage();
        return true;
    }

    function setOperator(address _operator) external {
        operator = _operator;
    }
}

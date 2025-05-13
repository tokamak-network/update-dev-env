// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockLayer2Manager {
    mapping(address => address) public _candidateAddOnOfOperator;

    function setCandidateAddOnOfOperator(
        address operator,
        address candidate
    ) external {
        _candidateAddOnOfOperator[operator] = candidate;
    }

    function candidateAddOnOfOperator(
        address operator
    ) external view returns (address) {
        return _candidateAddOnOfOperator[operator];
    }
}

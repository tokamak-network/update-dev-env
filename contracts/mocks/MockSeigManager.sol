// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockSeigManager {
    bool public returnValue = true;
    mapping(address => address) public coinages;

    event Comitted(address indexed layer2);

    function setReturnValue(bool _returnValue) external {
        returnValue = _returnValue;
    }

    function updateSeigniorage() external returns (bool) {
        emit Comitted(msg.sender);
        return returnValue;
    }

    function setCoinage(address candidateAddOn, address coinage) external {
        coinages[candidateAddOn] = coinage;
    }
}

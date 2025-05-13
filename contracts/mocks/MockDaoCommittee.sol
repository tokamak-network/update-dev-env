// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICandidate} from "../dao/interfaces/ICandidate.sol";
import {MockCandidateAddOn} from "./MockCandidateAddOn.sol";

contract MockDaoCommittee {
    event ClaimedActivityReward(
        address indexed candidate,
        address receiver,
        uint256 amount
    );

    function changeMember(uint256 _memberIndex) external returns (bool) {
        return true;
    }

    function retireMember() external returns (bool) {
        return true;
    }

    function castVote(
        uint256 _agendaID,
        uint256 _vote,
        string calldata _comment
    ) external {
        return;
    }

    function claimActivityReward(address _receiver) external {
        address candidate = ICandidate(msg.sender).candidate();
        emit ClaimedActivityReward(candidate, _receiver, 0);
        return;
    }

    function createCandidateAddOn(
        string calldata _memo,
        address _operator
    ) external returns (address) {
        return address(new MockCandidateAddOn());
    }
}

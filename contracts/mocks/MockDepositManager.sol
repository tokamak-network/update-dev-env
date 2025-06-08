// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockDepositManager {
    mapping(address => mapping(address => uint256)) public _accStaked;
    mapping(address => uint256) public _accStakedLayer2;
    mapping(address => uint256) public _accStakedAccount;

    struct WithdrawalReqeust {
        uint128 withdrawableBlockNumber;
        uint128 amount;
        bool processed;
    }

    mapping(address => mapping(address => WithdrawalReqeust[])) public _withdrawalRequests;
    mapping(address => mapping(address => uint256)) internal _pendingUnstaked;
    mapping(address => uint256) public _pendingUnstakedLayer2;
    mapping(address => uint256) public _pendingUnstakedAccount;

    mapping(address => mapping(address => uint256)) internal _accUnstaked;
    mapping(address => uint256) internal _accUnstakedLayer2;
    mapping(address => uint256) internal _accUnstakedAccount;

    mapping(address => mapping(address => uint256)) internal _withdrawalRequestIndex;

    event Deposited(address indexed layer2, address indexed account, uint256 amount);

    event WithdrawalRequested(address indexed layer2, address indexed account, uint256 amount);

    event WithdrawalProcessed(address indexed layer2, address indexed account, uint256 amount);

    function deposit(address layer2, uint256 amount) external returns (bool) {
        require(_deposit(layer2, msg.sender, amount, msg.sender), "fail deposit");
        return true;
    }

    function deposit(address layer2, address operator, uint256 amount) external returns (bool) {
        require(_deposit(layer2, msg.sender, amount, msg.sender), "fail deposit");
        return true;
    }

    function requestWithdrawal(address layer2, uint256 amount) external returns (bool) {
        return _requestWithdrawal(layer2, amount, getDelayBlocks(layer2));
    }

    function processRequest(address layer2, bool receiveTON) external returns (bool) {
        return _processRequest(layer2, receiveTON);
    }

    function processRequests(address layer2, uint256 n, bool receiveTON) external returns (bool) {
        for (uint256 i = 0; i < n; i++) {
            require(_processRequest(layer2, receiveTON), "fail processRequests");
        }
        return true;
    }

    function _deposit(address layer2, address account, uint256 amount, address) internal returns (bool) {
        require(account != address(0) && amount != 0, "zero amount or zero address");

        _accStaked[layer2][account] = _accStaked[layer2][account] + amount;
        _accStakedLayer2[layer2] = _accStakedLayer2[layer2] + amount;
        _accStakedAccount[account] = _accStakedAccount[account] + amount;

        emit Deposited(layer2, account, amount);
        return true;
    }

    function _requestWithdrawal(address layer2, uint256 amount, uint256 delay) internal returns (bool) {
        require(amount > 0, "DepositManager: amount must not be zero");
        require(amount < type(uint128).max, "Out of range");

        // uint256 delay = globalWithdrawalDelay > withdrawalDelay[layer2] ? globalWithdrawalDelay : withdrawalDelay[layer2];
        _withdrawalRequests[layer2][msg.sender].push(
            WithdrawalReqeust({
                withdrawableBlockNumber: uint128(block.number + delay),
                amount: uint128(amount),
                processed: false
            })
        );

        _pendingUnstaked[layer2][msg.sender] = _pendingUnstaked[layer2][msg.sender] + amount;
        _pendingUnstakedLayer2[layer2] = _pendingUnstakedLayer2[layer2] + amount;
        _pendingUnstakedAccount[msg.sender] = _pendingUnstakedAccount[msg.sender] + amount;

        emit WithdrawalRequested(layer2, msg.sender, amount);

        return true;
    }

    function _processRequest(address layer2, bool) internal returns (bool) {
        uint256 index = _withdrawalRequestIndex[layer2][msg.sender];
        require(_withdrawalRequests[layer2][msg.sender].length > index, "DepositManager: no request to process");

        WithdrawalReqeust storage r = _withdrawalRequests[layer2][msg.sender][index];

        require(r.withdrawableBlockNumber <= block.number, "DepositManager: wait for withdrawal delay");
        r.processed = true;

        _withdrawalRequestIndex[layer2][msg.sender] += 1;

        uint256 amount = r.amount;

        _pendingUnstaked[layer2][msg.sender] = _pendingUnstaked[layer2][msg.sender] - amount;
        _pendingUnstakedLayer2[layer2] = _pendingUnstakedLayer2[layer2] - amount;
        _pendingUnstakedAccount[msg.sender] = _pendingUnstakedAccount[msg.sender] - amount;

        _accUnstaked[layer2][msg.sender] = _accUnstaked[layer2][msg.sender] + amount;
        _accUnstakedLayer2[layer2] = _accUnstakedLayer2[layer2] + amount;
        _accUnstakedAccount[msg.sender] = _accUnstakedAccount[msg.sender] + amount;

        emit WithdrawalProcessed(layer2, msg.sender, amount);
        return true;
    }

    function getDelayBlocks(address layer2) public view returns (uint256) {
        return 100;
    }
}

//SPDX-License-Identifier: MIT

import "./Executor.sol";

pragma solidity ^0.8.3;

contract AA is Executor {
    address owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function execute_data(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 txGas
    ) public {
        require(msg.sender == owner, "Only owner can change value");
        execute(to, value, data, operation, txGas);
    }
}

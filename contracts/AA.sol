//SPDX-License-Identifier: MIT

import "./Executor.sol";

pragma solidity ^0.8.3;

contract AA is Executor {
    constructor() {}

    function execute_data(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 txGas
    ) public {
        execute(to, value, data, operation, txGas);
    }
}

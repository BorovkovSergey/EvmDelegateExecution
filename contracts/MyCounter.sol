//SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract MyCounter {
    uint8 counter;
    address owner;

    constructor(address _owner) {
        counter = 0;
        owner = _owner;
    }

    function changeValue(uint8 v) public {
        require(msg.sender == owner, "Only owner can change value");
        counter = v;
    }

    function getCounter() public view returns (uint8) {
        return counter;
    }
}

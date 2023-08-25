//SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract MyCounter {
    uint8 counter;

    constructor() {
        counter = 0;
    }

    function changeValue(uint8 v) public {
        counter = v;
    }

    function getCounter() public view returns (uint8) {
        return counter;
    }
}

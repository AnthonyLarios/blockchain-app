pragma solidity ^0.5.0;

contract Token {
  string public name = "Hello, world.";
  string public symbol = "HW";
  uint256 public decimals = 18;
  uint256 public totalSupply;

  constructor() public {
    totalSupply = 100 * (10 ** decimals);
  }
}

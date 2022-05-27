pragma solidity ^0.5.0;

contract Token {
  string public name = "Hello, world.";
  string public symbol = "HW";
  uint256 public decimals = 18;
  uint256 public totalSupply;

  // track balances
  mapping(address => uint256) public balanceOf;

  constructor() public {
    totalSupply = 100 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }
}

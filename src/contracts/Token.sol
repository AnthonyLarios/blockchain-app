pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Token {

  using SafeMath for uint;

  string public name = "Hello, world.";
  string public symbol = "HW";
  uint256 public decimals = 18;
  uint256 public totalSupply;

  mapping(address => uint256) public balanceOf;

  constructor() public {
    totalSupply = 100 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint256 _amount) public returns(bool success) {
    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_amount);
    balanceOf[_to] = balanceOf[_to].add(_amount);
    return true;
  }
}

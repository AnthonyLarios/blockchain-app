pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Token {

  using SafeMath for uint;

  string public name = "Hello, world.";
  string public symbol = "HW";
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  event Transfer(address indexed from, address indexed to , uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  constructor() public {
    totalSupply = 100 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint256 _amount) public returns(bool success) {
    require(_to != address(0));
    require(balanceOf[msg.sender] >= _amount);

    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_amount);
    balanceOf[_to] = balanceOf[_to].add(_amount);
    emit Transfer(msg.sender, _to, _amount);
    return true;
  }

  function approve(address _spender, uint256 _amount) public returns(bool success) {
    allowance[msg.sender][_spender] = _amount;
    emit Approval(msg.sender, _spender, _amount);
    return true;
  }
}

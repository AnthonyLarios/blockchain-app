pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import "./Token.sol";

// TODO:
// [ ] Withdraw Ether
// [ ] Withdraw Token
// [ ] Check Balances
// [ ] Make Order
// [ ] Cancel Order
// [ ] Fill Order
// [ ] Charge Fees

contract Exchange {

  using SafeMath for uint;

  address public feeAccount;
  uint256 public feePercent;
  address constant ETHER = address(0);

  mapping(address => mapping(address => uint256)) public tokens;

  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);

  constructor (address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  function() external {
    revert();
  }

  function depositEther() payable public {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint256 _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount);
    
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    msg.sender.transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));

    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
}

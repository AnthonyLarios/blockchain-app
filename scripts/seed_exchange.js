const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";

const ether = (n) => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), "ether")
  );
};

const tokens = (n) => ether(n);

const wait = (seconds) => {
  const milliseconds = seconds * 1000;
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const token = await Token.deployed();
    const exchange = await Exchange.deployed();

    console.log(`Token fetched: ${token.address}`);
    console.log(`Exchange fetched: ${exchange.address}`);

    const sender = accounts[0];
    const receiver = accounts[1];
    let amount = web3.utils.toWei("10", "ether");

    await token.transfer(receiver, amount, { from: sender });
    console.log(`Transfered ${amount} tokens from ${sender} to ${receiver}`);

    const user1 = accounts[0];
    const user2 = accounts[1];

    amount = 1;
    await exchange.depositEther({ from: user1, value: ether(amount) });
    console.log(`Deposited ${amount} Ether from ${user1}`);

    amount = 10;
    await token.approve(exchange.address, tokens(amount), { from: user2 });
    console.log(`Approved ${amount} tokens from ${user1}`);

    await exchange.depositToken(token.address, tokens(amount), { from: user2 });
    console.log(`Deposited ${amount} tokens from ${user1}`);

    // Cancel Order
    let result, orderID;
    result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(0.1), { from: user1 });
    console.log(`Made order from ${user1}`);

    orderID = result.logs[0].args.id;
    await exchange.cancelOrder(orderID, { from: user1 });
    console.log(`Cancelled order from ${user1}`);

    // Order Number "1"
    result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(0.1), { from: user1 });
    console.log(`Made order from ${user1}`);
    orderID = result.logs[0].args.id;
    await exchange.fillOrder(orderID, { from: user2 });
    console.log(`Filled order from ${user2}`);
    await wait(1);

    // Order Number "2"
    result = await exchange.makeOrder(token.address, tokens(2), ETHER_ADDRESS, ether(0.2), { from: user1 });
    console.log(`Made order from ${user1}`);
    orderID = result.logs[0].args.id;
    await exchange.fillOrder(orderID, { from: user2 });
    console.log(`Filled order from ${user2}`);
    await wait(1);

    // Order Number "3"
    result = await exchange.makeOrder(token.address, tokens(3), ETHER_ADDRESS, ether(0.3), { from: user1 });
    console.log(`Made order from ${user1}`);
    orderID = result.logs[0].args.id;
    await exchange.fillOrder(orderID, { from: user2 });
    console.log(`Filled order from ${user2}`);
    await wait(1);

    // Loop open orders
    for(let i = 1; i <= 5; i++) {
      result = await exchange.makeOrder(token.address, tokens(0.1 * i), ETHER_ADDRESS, ether(0.01 * i), { from: user1 });
      console.log(`Made order from ${user1}`);
      await wait(1);
    }

    for(let i = 1; i <= 5; i++) {
      result = await exchange.makeOrder(ETHER_ADDRESS, ether(0.02 * i), token.address, tokens(0.2 * i), { from: user2 });
      console.log(`Made order from ${user2}`);
      await wait(1);
    }

  } catch(error) {
    console.log(error);
  }

  callback();
}

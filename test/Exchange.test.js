import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers';

const Token = artifacts.require("./Token");
const Exchange = artifacts.require("./Exchange");

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let token, exchange;
  const feePercent = 1;

  beforeEach(async () => {
    token = await Token.new();
    token.transfer(user1, tokens(10), { from: deployer });
    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("deployment", () => {
    
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });

    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      result.toString().should.equal(feePercent.toString());
    });
  });

  describe("fallback", () => {

    it("reverts when Ether is sent", async () => {
      await exchange.sendTransaction({ from: user1, value: ether(1) }).should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("depositing Ether", () => {
    let result, amount;

    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it("tracks the Ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });

    it("emits a deposit event", async () => {
      const log = result.logs[0];
      log.event.should.equal("Deposit");
      const event = log.args;
      event.token.should.equal(ETHER_ADDRESS, "token address is correct");
      event.user.should.equal(user1, "user address is correct");
      event.amount.toString().should.equal(amount.toString(), "amount is correct");
      event.balance.toString().should.equal(amount.toString(), "balance is correct");
    });
  });

  describe("withdrawing Ether", () => {
    let result, amount;

    beforeEach(async () => {
      amount = ether(1);
      await exchange.depositEther({ from: user1, value: amount });
    });

    describe("success", () => {

      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 });
      });

      it("withdraws Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal("0");
      });

      it("emits a withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Withdraw");
        const event = log.args;
        event.token.should.equal(ETHER_ADDRESS, "token address is correct");
        event.user.should.equal(user1, "user address is correct");
        event.amount.toString().should.equal(amount.toString(), "amount is correct");
        event.balance.toString().should.equal("0", "balance is correct");
      });
    });

    describe("failure", () => {

      it("rejects withdraws for insufficient balances", async () => {
        await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("depositing tokens", () => {
    let result, amount;

    describe("success", () => {

      beforeEach(async () => {
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, { from: user1 });
      });

      it("tracks the token deposit", async () => {
        let balance;
        balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());

        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it("emits a deposit event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Deposit");
        const event = log.args;
        event.token.should.equal(token.address, "token address is correct");
        event.user.should.equal(user1, "user address is correct");
        event.amount.toString().should.equal(amount.toString(), "amount is correct");
        event.balance.toString().should.equal(amount.toString(), "balance is correct");
      });
    });

    describe("failure", () => {

      it("rejects Ether deposits", async () => {
        await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
      });

      it("fails when no tokens are apporved", async () => {
        await exchange.depositToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
      });
    });
  });


  describe("withdrawing tokens", () => {
    let result, amount;

    describe("success", () => {

      beforeEach(async () => {
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, { from: user1 });
        result = await exchange.withdrawToken(token.address, amount, { from: user1 });
      });

      it("withdraws token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });

      it("emits a withdraw event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Withdraw");
        const event = log.args;
        event.token.should.equal(token.address, "token address is correct");
        event.user.should.equal(user1, "user address is correct");
        event.amount.toString().should.equal(amount.toString(), "amount is correct");
        event.balance.toString().should.equal("0", "balance is correct");
      });
    });

    describe("failure", () => {

      it("rejects Ether withdrawals", async () => {
        await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT);
      });

      it("fails for insufficient balances", async () => {
        await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("checking balances", () => {
    const amount = ether(1);

    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: amount });
    });

    it("returns user balance", async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1);
      result.toString().should.equal(amount.toString());
    });
  });

  describe("making orders", () => {
    let result;

    beforeEach(async () => {
      result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 });
    });

    it("tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount();
      orderCount.toString().should.equal("1");

      const order = await exchange.orders("1");
      order.id.toString().should.equal("1", "tokenGet is correct");
      order.user.should.equal(user1, "user is correct");
      order.tokenGet.should.equal(token.address, "tokentGet is correct");
      order.amountGet.toString().should.equal(tokens(1).toString(), "amountGet is correct");
      order.tokenGive.should.equal(ETHER_ADDRESS, "tokentGive is correct");
      order.amountGive.toString().should.equal(ether(1).toString(), "amountGive is correct");
      order.timeStamp.toString().length.should.be.at.least(1, "time stamp is present");
    });

    it("emits an order event", async () => {
      const log = result.logs[0];
      log.event.should.equal("Order");
      const event = log.args;
      event.id.toString().should.equal("1", "tokenGet is correct");
      event.user.should.equal(user1, "user is correct");
      event.tokenGet.should.equal(token.address, "tokentGet is correct");
      event.amountGet.toString().should.equal(tokens(1).toString(), "amountGet is correct");
      event.tokenGive.should.equal(ETHER_ADDRESS, "tokentGive is correct");
      event.amountGive.toString().should.equal(ether(1).toString(), "amountGive is correct");
      event.timeStamp.toString().length.should.be.at.least(1, "time stamp is present");
    });
  });

  describe("order actions", () => {

    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) });
      await token.transfer(user2, tokens(10), { from: deployer });
      await token.approve(exchange.address, tokens(2), { from: user2 });
      await exchange.depositToken(token.address, tokens(2), { from: user2 });
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 });
    });

    describe("filling orders", () => {
      let result;

      describe("success", () => {

        beforeEach(async () => {
          result = await exchange.fillOrder("1", { from: user2 });
        });

        it("executes the trade and charge fees", async () => {
          let balance;

          balance = await exchange.balanceOf(token.address, user1);
          balance.toString().should.equal(tokens(1).toString(), "user1 received tokens");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
          balance.toString().should.equal("0", "user1 Ether deducted");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
          balance.toString().should.equal(ether(1).toString(), "user2 received Ether");
          balance = await exchange.balanceOf(token.address, user2);
          balance.toString().should.equal(tokens(0.99).toString(), "user2 received tokens with fee applied");
          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          balance.toString().should.equal(tokens(0.01).toString(), "feeAccount received fee");
        });

        it("updates fill orders", async () => {
          const orderFilled = await exchange.orderFilled(1);
          orderFilled.should.equal(true);
        });

        it("emits a trade event", async () => {
          const log = result.logs[0];
          log.event.should.equal("Trade");
          const event = log.args;
          event.id.toString().should.equal("1", "id is correct");
          event.user.should.equal(user1, "user is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet.toString().should.equal(tokens(1).toString(), "amountGet is correct");
          event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
          event.amountGive.toString().should.equal(ether(1).toString(), "amountGive is correct");
          event.userFill.should.equal(user2, "userFill is correct");
          event.timeStamp.toString().length.should.be.at.least(1, "timeStamp is present");
        });
      });

      describe("failure", () => {

        it("rejects invalid order ids", async () => {
          const invalidOrderID = 111;
          await exchange.fillOrder(invalidOrderID, { from: user2 }).should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects orders that are already filled", async () => {
          await exchange.fillOrder("1", { from: user2 }).should.be.fulfilled;
          await exchange.fillOrder("1", { from: user2 }).should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects cancelled orders", async () => {
          await exchange.cancelOrder("1", { from: user1 }).should.be.fulfilled;
          await exchange.fillOrder("1", { from: user2 }).should.be.rejectedWith(EVM_REVERT);
        });
      });
    });

    describe("cancelling orders", () => {
      let result;

      describe("success", () => {

        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("updates cancelled orders", async () =>{
          const orderCancelled = await exchange.orderCancelled(1);
          orderCancelled.should.equal(true);
        });

        it("emits a cancel event", () => {
          const log = result.logs[0];
          log.event.should.equal("Cancel");
          const event = log.args;
          event.id.toString().should.equal("1", "ID is correct");
          event.user.should.equal(user1, "User is correct");
          event.tokenGet.should.equal(token.address, "tokenGet is correct");
          event.amountGet.toString().should.equal(tokens(1).toString(), "amountGet is correct");
          event.tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is correct");
          event.amountGive.toString().should.equal(ether(1).toString(), "amountGive is correct");
          event.timeStamp.toString().length.should.be.at.least(1, "timeStamp is present");
        });
      });

      describe("failure", async () => {

        it("rejects an invalid order", async () => {
          const invalidOrderID = 111;
          await exchange.cancelOrder(invalidOrderID, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects unauthorized cancelations", async () => {
          await exchange.cancelOrder("1", { from: user2}).should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });
});

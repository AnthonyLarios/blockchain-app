import { tokens, EVM_REVERT } from './helpers.js';

const Token = artifacts.require("./Token");

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract("Token", ( [deployer, receiver, exchange] ) => {

  const name = "Hello, world.";
  const symbol = "HW";
  const decimals = "18";
  const totalSupply = tokens(100).toString();
  let token;

  beforeEach(async () => {
    token = await Token.new();
  });

  describe("deployment", () => {

    it("tracks the name", async () => {
      const result = await token.name();
      result.should.equal(name);
    });

    it("tracks the symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });

    it("tracks the decimals", async () => {
      const result = await token.decimals();
      result.toString().should.equal(decimals);
    });

    it("tracks the total supply", async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(totalSupply);
    });

    it("assigns the total supply to the deployer", async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply);
    });
  });

  describe("sending tokens", () => {
    let result, amount;

    describe("success", () => {

      beforeEach(async () => {
        amount = tokens(1);
        result = await token.transfer(receiver, amount, { from: deployer });
      });

      it("transfers token balances", async () => {
        let balanceOf;

        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(99).toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(1).toString());
      });

      it("emits a transfer event", () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");

        const event = log.args;
        event.from.should.equal(deployer, "from is correct");
        event.to.should.equal(receiver, "to is correct");
        event.value.toString().should.equal(amount.toString(), "value is correct");
      });
    });

    describe("failure", () => {
      it("rejects insufficient balances", async () => {
        let invalidAmount = tokens(1000);
        await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects insufficient balances", async () => {
        let invalidAmount = tokens(1);
        await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipients", () => {
        token.transfer(0x0, amount, { from: deployer }).should.be.rejected;
      });
    });
  });

  describe("approving tokens", () => {

    let result, amount;

    beforeEach(async () => {
      amount = tokens(10);
      result = await token.approve(exchange, amount, { from: deployer} );
    });

    describe("success", () => {

      it("allocates an allowance for delegated token spending on exchange", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal(amount.toString());
      });

      it("emits an approval event", () => {
        const log = result.logs[0];
        log.event.should.equal("Approval");

        const event = log.args;
        event.owner.should.equal(deployer, "owner is correct");
        event.spender.should.equal(exchange, "spender is correct");
        event.value.toString().should.equal(amount.toString(), "value is correct");
      });
    });

    describe("faliure", () => {

      it("rejects invalide spender", async () => {
        await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
      });
    });
  });

  describe("sending tokens form exchange", () => {
    let result, amount;

    beforeEach(async () => {
      amount = tokens(10);
      await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {

      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, amount, { from: exchange });
      });

      it("transfers token balances", async () => {
        let balanceOf;

        balanceOf = await token.balanceOf(deployer);
        balanceOf.toString().should.equal(tokens(90).toString());
        balanceOf = await token.balanceOf(receiver);
        balanceOf.toString().should.equal(tokens(10).toString());
      });
    });
  });
});

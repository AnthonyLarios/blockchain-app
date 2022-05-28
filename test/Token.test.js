import { tokens } from './helpers.js';

const Token = artifacts.require("./Token");

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract("Token", ([deployer, receiver]) => {

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

    describe("success", async () => {

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

      it("emits a transfer event", async() => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");

        const event = log.args;
        event.from.should.equal(deployer, "from is correct");
        event.to.should.equal(receiver, "to is correct");
        event.value.toString().should.equal(amount.toString(), "value is correct");
      });
    });

    describe("failure", async() => {
      it("rejects insufficient balances", async () => {
        let invalidAmount = tokens(1000);
        let error = "VM Exception while processing transaction: revert";
        await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(error);
      });
    });
  });
});

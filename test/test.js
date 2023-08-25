const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledCounter = require('../build/contracts/MyCounter.json');
const counterAbi = compiledCounter.abi;
const counterBytecode = compiledCounter.bytecode;

let counterAddress;
let counterContract;


const aaCounter = require('../build/contracts/AA.json');
const aaAbi = aaCounter.abi;
const aaBytecode = aaCounter.bytecode;

let aaAddress;
let aaContract;

let signerAccount;

before(async () => {
    accounts = await web3.eth.getAccounts();

    // DEPLOY COUNTER
    {
        const contract = new web3.eth.Contract(counterAbi);

        const deploy = contract.deploy({
            data: counterBytecode,
        });
        const deployTransaction = deploy.encodeABI();
        const gasEstimate = await web3.eth.estimateGas({
            data: deployTransaction
        });
        const deployReceipt = await deploy.send({
            from: accounts[0],
            gas: gasEstimate,
            gasPrice: web3.utils.toWei('20', 'gwei')
        });

        counterAddress = deployReceipt.options.address;

        counterContract = new web3.eth.Contract(counterAbi, counterAddress);
    }

    // DEPLOY AA
    {
        const contract = new web3.eth.Contract(aaAbi);

        const deploy = contract.deploy({
            data: aaBytecode,
        });
        const deployTransaction = deploy.encodeABI();
        const gasEstimate = await web3.eth.estimateGas({
            data: deployTransaction
        });
        const deployReceipt = await deploy.send({
            from: accounts[0],
            gas: gasEstimate,
            gasPrice: web3.utils.toWei('20', 'gwei')
        });

        aaAddress = deployReceipt.options.address;

        aaContract = new web3.eth.Contract(aaAbi, aaAddress);
    }

    const password_to = "testpassword2";
    signerAccount = await web3.eth.personal.newAccount(password_to);
    await web3.eth.personal.unlockAccount(signerAccount, password_to, 600);
})

describe('Aggregation', () => {
    it("should do send funds over redirect contract", async () => {
        await web3.eth.sendTransaction({ from: accounts[0], to: signerAccount, value: web3.utils.toWei('10', 'ether') });

        const signer_initial_balance = await web3.eth.getBalance(signerAccount);
        assert.equal(signer_initial_balance.toString(10), "10000000000000000000");

        let counter_0 = await counterContract.methods.getCounter().call();

        console.log("counter 0", counter_0);
        assert.equal(counter_0, 0);

        await counterContract.methods.changeValue(1).send({
            from: signerAccount,
            gasLimit: 2000000
        });

        let counter_1 = await counterContract.methods.getCounter().call();

        console.log("counter 1", counter_1);
        assert.equal(counter_1, 1);

        let change_value_data = await counterContract.methods.changeValue(123).encodeABI();

        let change_value = await aaContract.methods.execute_data(
            counterAddress, 0, change_value_data,
            0, // DelegateCall
            42292
        ).send({
            from: signerAccount,
            gasLimit: 2000000
        });

        let counter_123 = await counterContract.methods.getCounter().call();

        console.log("counter 123", counter_123);
        assert.equal(counter_123, 123);

        console.log("change_value", change_value);
    });
});
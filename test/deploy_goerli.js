const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3('https://eth-goerli.g.alchemy.com/v2/demo');

const aaCounter = require('../build/contracts/AA.json');
const aaAbi = aaCounter.abi;
const aaBytecode = aaCounter.bytecode;

let aaAddress;

let signerPK;
let signer;

describe('Deploy', () => {
    it("should deploy", async () => {
        accounts = await web3.eth.getAccounts();

        signerPK = "...";
        signer = web3.eth.accounts.privateKeyToAccount(signerPK).address;

        // DEPLOY AA
        {
            const contract = new web3.eth.Contract(aaAbi);

            const deploy = contract.deploy({
                data: aaBytecode,
                arguments: [signer]
            });
            const deployTransaction = deploy.encodeABI();
            const deployAA = await web3.eth.accounts.signTransaction({
                nonce: web3.eth.getTransactionCount(signer),
                gasPrice: web3.utils.toWei('50', 'wei'),
                gasLimit: web3.utils.toHex(500000),
                value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
                data: deployTransaction
            }, signerPK);
            const deployReceipt = await web3.eth.sendSignedTransaction(deployAA.rawTransaction);

            aaAddress = deployReceipt.contractAddress;
            console.log("aaAddress", aaAddress);
        }
    }).timeout(40000);
});
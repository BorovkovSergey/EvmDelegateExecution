const Web3 = require('web3');
const web3 = new Web3('https://eth-goerli.g.alchemy.com/v2/9MthO5V2PGczoQFA80VKBR4A1HptU0pj');
const { ethers } = require('ethers');
const provider = new ethers.providers.getDefaultProvider("https://eth-goerli.g.alchemy.com/v2/9MthO5V2PGczoQFA80VKBR4A1HptU0pj");

const aaAddress = "0x4bd17c200CFf07525c19f190f3dcA242E00F7dE0";
const aaCounter = require('../build/contracts/AA.json');
const aaAbi = aaCounter.abi;
const aaContract = new web3.eth.Contract(aaAbi, aaAddress);

// using partial ABI for simplicity
const LIDO_ABI = [
    {
        constant: false,
        inputs: [{ name: "_referral", type: "address" }],
        name: "submit",
        outputs: [{ name: "", type: "uint256" }],
        payable: true,
        stateMutability: "payable",
        type: "function"
    }
];

const LIDO_ADDRESS = "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F"
const lidoContract = new web3.eth.Contract(LIDO_ABI, LIDO_ADDRESS);

const MY_REWARDS_ADDRESS = "0x4bd17c200CFf07525c19f190f3dcA242E00F7dE0"

let myEoa = "0xBe176988696Eb8aad9Ce9CeAA1307d9f87034908";
let myPK = "...";

// https://docs.lido.fi/integrations/wallets/
async function stakeWithLido() {
    const tx = await lidoContract.methods
        .submit(MY_REWARDS_ADDRESS);
    return tx.encodeABI();
}

describe('Aggregation', () => {
    it("lido stake", async () => {
        const balanceWei = await provider.getBalance(myEoa);
        const balanceEther = ethers.utils.formatEther(balanceWei);
        console.log(`Balance of address ${myEoa} on Goerli testnet: ${balanceEther} ETH`);

        let data = await stakeWithLido();
        let data_to_execution = await aaContract.methods.execute_data(
            LIDO_ADDRESS,
            web3.utils.toWei("0.001"),
            data,
            0, // DelegateCall
            web3.utils.toHex(3500000),
        ).encodeABI();

        const signedTx = await web3.eth.accounts.signTransaction({
            nonce: web3.eth.getTransactionCount(myEoa),
            gasPrice: web3.utils.toWei('50', 'wei'),
            gasLimit: web3.utils.toHex(3500000),
            to: aaAddress,
            value: web3.utils.toHex(web3.utils.toWei('0.0', 'ether')),
            data: data_to_execution
        }, myPK);

        await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('Staking completed!');
    }).timeout(40000);
});
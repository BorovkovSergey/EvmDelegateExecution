const Web3 = require('web3');
const web3 = new Web3('https://eth-goerli.g.alchemy.com/v2/demo');
const { ethers } = require('ethers');
const { ChainId, Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const fs = require('fs');

const provider = new ethers.providers.getDefaultProvider("https://eth-goerli.g.alchemy.com/v2/demo");

const aaAddress = "0x4bd17c200CFf07525c19f190f3dcA242E00F7dE0";
const aaCounter = require('../build/contracts/AA.json');
const aaAbi = aaCounter.abi;
const aaContract = new web3.eth.Contract(aaAbi, aaAddress);

let tokenAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";


let myEoa = "0xBe176988696Eb8aad9Ce9CeAA1307d9f87034908";
let myPK = "...";

const chainId = ChainId.GÖRLI;
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_ROUTER_ABI = fs.readFileSync("./abis/router.json").toString()
UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, provider)

const wallet = new ethers.Wallet(myPK, provider)

const UNI_TOKEN = new Token(
    chainId,
    tokenAddress,
    18
);

// regular EOA swap
async function swapTokens(token1, token2, amount, slippage = "50") {
    try {
        const rawTxn = swapData(token1, token2, amount, slippage);
        //Returns a Promise which resolves to the transaction.
        let sendTxn = (await wallet).sendTransaction(rawTxn)

        //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
        let reciept = (await sendTxn).wait()

        //Logs the information about the transaction it has been mined.
        if (reciept) {
            console.log(" - Transaction is mined - " + '\n'
                + "Transaction Hash:", (await sendTxn).hash
                + '\n' + "Block Number: "
                + (await reciept).blockNumber + '\n'
                + "Navigate to https://rinkeby.etherscan.io/txn/"
            + (await sendTxn).hash, "to see your transaction")
        } else {
            console.log("Error submitting transaction")
        }

    } catch (e) {
        console.log(e)
    }
}

async function swapData(token1, token2, amount, slippage = "50") {
    const pair = await Fetcher.fetchPairData(token1, token2, provider); //creating instances of a pair
    const route = await new Route([pair], token2); // a fully specified path from input token to output token
    let amountIn = ethers.utils.parseEther(amount.toString()); //helper function to convert ETH to Wei
    amountIn = amountIn.toString()

    const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance

    const trade = new Trade( //information necessary to create a swap transaction.
        route,
        new TokenAmount(token2, amountIn),
        TradeType.EXACT_INPUT
    );

    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
    const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    const path = [token2.address, token1.address]; //An array of token addresses
    const to = aaAddress; // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
    const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string
    console.log("0");

    //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
    const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
        value: valueHex,
        gasLimit: 250000
    });
    console.log("rawTxn", rawTxn);
    return rawTxn;
}


before(async () => {
});

describe('Aggregation', () => {
    it("swap", async () => {
        const balanceWei = await provider.getBalance(myEoa);
        const balanceEther = ethers.utils.formatEther(balanceWei);
        console.log(`Balance of address ${myEoa} on Goerli testnet: ${balanceEther} ETH`);

        let data = await swapData(UNI_TOKEN, WETH[chainId], .002);
        console.log("data", data);
        let data_to_execution = await aaContract.methods.execute_data(
            data.to,
            data.value,
            data.data,
            0, // DelegateCall
            data.gasLimit,
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

        console.log('Swap completed!');
    }).timeout(40000);
});
const Web3 = require('web3')
const Big = require('bignumber.js')

const web3 = new Web3(Web3.givenProvider)
import { config } from '../dapp.config'

const contract = require('../artifacts/contracts/CrosmoBaby.sol/AlienCrosmobaby.json')
const nftContract = new web3.eth.Contract(contract.abi, config.contractAddress)

export const getTotalMinted = async () => {
  return await nftContract.methods.totalSupply().call()
}

export const getMaxSupply = async () => {
  return await nftContract.methods.maxSupply().call()
}

export const getBalance = async (wallet) => {
  return Number(await nftContract.methods.balanceOf(wallet).call())
}

export const isPausedState = async () => {
  return await nftContract.methods.paused().call()
}

export const isCrosmocraft = async (wallet) => {
  return await nftContract.methods.isCrosmocraft(wallet).call()
}

export const isCrosmonaut = async (wallet) => {
  return await nftContract.methods.isCrosmonaut(wallet).call()
}

export const getSaleState = async () => {
  return Number(await nftContract.methods.saleState().call())
}

export const getMintPrice = async (wallet) => {
  return await nftContract.methods.mintCost(wallet).call()
}

export const getPrice = async () => {
  return await nftContract.methods.price().call()
}

export const getWalletBalance = async (wallet) => {
  return await web3.eth.getBalance(wallet)
}

export const presaleMint = async (mintAmount) => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: 'To be able to mint, you need to connect your wallet'
    }
  }



  const nonce = await web3.eth.getTransactionCount(
    window.ethereum.selectedAddress,
    'latest'
  )

  // Set up our Ethereum transaction
  const tx = {
    to: config.contractAddress,
    from: window.ethereum.selectedAddress,
    value: parseInt(
      web3.utils.toWei(String(config.price * mintAmount), 'ether')
    ).toString(16), // hex
    data: nftContract.methods
      .presaleMint(window.ethereum.selectedAddress, mintAmount, proof)
      .encodeABI(),
    nonce: nonce.toString(16)
  }

  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

    return {
      success: true,
      status: (
        <a href={`https://cronoscan.com/tx/${txHash}`} target="_blank">
          <p>✅ Check out your transaction on Etherscan:</p>
          <p>{`https://cronoscan.com/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: '😞 Smth went wrong:' + error.message
    }
  }
}

export const publicMint = async (mintAmount, totalPrice, useHigherGas) => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: 'To be able to mint, you need to connect your wallet'
    }
  }

  const nonce = await web3.eth.getTransactionCount(
    window.ethereum.selectedAddress,
    'latest'
  )

  // Set up our Ethereum transaction
  let tx = {
    to: config.contractAddress,
    from: window.ethereum.selectedAddress,
    value: '0x' + new Big(totalPrice).toString(16), // hex
    data: nftContract.methods.mint(mintAmount).encodeABI(),
    nonce: nonce.toString(16)
  }

  console.log(tx)

  const gas = await nftContract.methods.mint(mintAmount).estimateGas(tx)
  const gasPrice = await web3.eth.getGasPrice()
  console.log({gas,gasPrice})
  tx = {...tx, gas: web3.utils.toHex(Math.ceil(gas * (useHigherGas ? 1.5 : 1.2))), gasPrice: web3.utils.toHex(Math.ceil(gasPrice * (useHigherGas ? 1.5 : 1.2)))}

  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

    return {
      success: true,
      status: (
        <a href={`https://cronoscan.com/tx/${txHash}`} target="_blank">
          <p>✅ Check out your transaction on Etherscan:</p>
          <p>{`https://cronoscan.com/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: '😞 Smth went wrong:' + error.message
    }
  }
}

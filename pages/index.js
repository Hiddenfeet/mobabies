import { useState, useEffect } from 'react'
import Big from 'bignumber.js'
import { initOnboard } from '../utils/onboard'
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import { config } from '../dapp.config'
import {
  isPausedState,
  presaleMint,
  publicMint,
  getSaleState,
  getTotalMinted,
  getMaxSupply,
  isCrosmocraft,
  isCrosmonaut,
  getBalance,
  getMintPrice,
  getWalletBalance
} from '../utils/interact'

export default function Mint() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [maxSupply, setMaxSupply] = useState(0)
  const [totalMinted, setTotalMinted] = useState(0)
  const [maxMintAmount, setMaxMintAmount] = useState(0)
  const [paused, setPaused] = useState(false)
  const [saleState, setSaleState] = useState(0)
  const [walletLimit, setWalletLimit] = useState(0)
  const [balance, setBalance] = useState(0)
  const [hasCrosmocraft, setHasCrosmocraft] = useState(false)
  const [hasCrosmonaut, setHasCrosmonaut] = useState(false)
  const [mintPrice, setMintPrice] = useState('0')
  const [totalPrice, setTotalPrice] = useState('0')

  const [status, setStatus] = useState(null)
  const [mintAmount, setMintAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  const [onboard, setOnboard] = useState(null)

  useEffect(() => {
    setOnboard(initOnboard)
  }, [])

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets])

  useEffect(() => {
    if (!onboard) return

    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true
          }
        })
      }

      setWalletFromLocalStorage()
    }
  }, [onboard, connect])

  useEffect(() => {
    const init = async () => {
      setPaused(await isPausedState())
      setTotalMinted(await getTotalMinted())
      setMaxSupply(await getMaxSupply())
      
      let newBalance = 0
      if (!!wallet && !!wallet.accounts && wallet.accounts.length > 0) {
        newBalance = await getBalance(wallet.accounts[0].address)
        setBalance(newBalance)
        const price = await getMintPrice(wallet.accounts[0].address)
        setMintPrice(price)
        const newTotal = new Big(price).multipliedBy(mintAmount).toString()
        setTotalPrice(newTotal)
      }

      const saleSt = await getSaleState()
      setSaleState(saleSt)
      let wlLimit = 0
      if (saleSt === 1 && !!wallet && !!wallet.accounts && wallet.accounts.length > 0) {
        const isCraft = await isCrosmocraft(wallet.accounts[0].address)
        const isNaut = await isCrosmonaut(wallet.accounts[0].address)
        setHasCrosmocraft(isCraft)
        setHasCrosmonaut(isNaut)
        if (isCraft || isNaut) {
          wlLimit = 4
        }
      } else if (saleSt === 2) {
        wlLimit = 10
      }
      setWalletLimit(wlLimit)

      setMaxMintAmount(
        Math.max(wlLimit - newBalance, 0)
      )
    }

    init()
  }, [wallet])

  useEffect(() => {
    const newTotal = new Big(mintPrice).multipliedBy(mintAmount).toString()
    setTotalPrice(newTotal)
  }, [mintAmount])

  const incrementMintAmount = () => {
    if (mintAmount < maxMintAmount) {
      setMintAmount(mintAmount + 1)
    }
  }

  const decrementMintAmount = () => {
    if (mintAmount > 1) {
      setMintAmount(mintAmount - 1)
    }
  }

  const presaleMintHandler = async () => {
    setIsMinting(true)

    const { success, status } = await presaleMint(mintAmount)

    setStatus({
      success,
      message: status
    })

    setIsMinting(false)
  }
  const publicMintHandler = async () => {
    setIsMinting(true)

    const { success, status } = await publicMint(mintAmount)

    setStatus({
      success,
      message: status
    })

    setIsMinting(false)
  }

  const mint = async () => {
    if (paused) {
      return setStatus({
        success: false,
        message: 'Minting is paused'
      })
    }
    if (saleState === 0) {
      return setStatus({
        success: false,
        message: 'Sale is not started'
      })
    }
    if (saleState === 1 && (!isCrosmocraft && isCrosmonaut)) {
      return setStatus({
        success: false,
        message: 'No Crosmocraft or Crosmonaut'
      })
    }
    if (mintAmount <= 0) {
      return setStatus({
        success: false,
        message: 'Mint amount should not be 0'
      })
    }
    if (balance + mintAmount > walletLimit) {
      return setStatus({
        success: false,
        message: 'Exceeds max mintable nfts per wallet'
      })
    }
    if (totalMinted + mintAmount > maxSupply) {
      return setStatus({
        success: false,
        message: 'Exceeds max mintable nfts'
      })
    }
    
    const walletBlnc = await getWalletBalance(wallet.accounts[0].address)
    if (new Big(walletBlnc).lt(new Big(totalPrice))) {
      return setStatus({
        success: false,
        message: 'Insufficient fund'
      })
    }
    const { success, status } = await publicMint(mintAmount,totalPrice)

    setStatus({
      success,
      message: status
    })

    setIsMinting(false)
  }

  return (
    <div className="min-h-screen h-full w-full overflow-hidden flex flex-col items-center justify-center bg-brand-background ">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <img
          src="/images/blur.jpeg"
          className="animate-pulse-slow absolute inset-auto block w-full min-h-screen object-cover"
        />

        <div className="flex flex-col items-center justify-center h-full w-full px-2 md:px-10">
          <div className="relative z-1 md:max-w-3xl w-full bg-gray-900/90 filter backdrop-blur-sm py-4 rounded-md px-2 md:px-10 flex flex-col items-center">
            {wallet && (
              <button
                className="absolute right-4 bg-indigo-600 transition duration-200 ease-in-out font-chalk border-2 border-[rgba(0,0,0,1)] shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none px-4 py-2 rounded-md text-sm text-white tracking-wide uppercase"
                onClick={() =>
                  disconnect({
                    label: wallet.label
                  })
                }
              >
                Disconnect
              </button>
            )}
            <h1 className="font-coiny uppercase font-bold text-3xl md:text-4xl bg-gradient-to-br  from-brand-green to-brand-blue bg-clip-text text-transparent mt-3">
              {paused ? 'Paused' : (saleState === 1 ? 'Pre-Sale' : (saleState === 2 ? 'Public Sale' : 'Sale not started'))}
            </h1>
            <h3 className="text-sm text-pink-200 tracking-widest">
              {wallet?.accounts[0]?.address
                ? wallet?.accounts[0]?.address.slice(0, 8) +
                  '...' +
                  wallet?.accounts[0]?.address.slice(-4)
                : ''}
            </h3>

            <div className="flex flex-col md:flex-row md:space-x-14 w-full mt-10 md:mt-14">
              <div className="relative w-full">
                <div className="font-coiny z-10 absolute top-2 left-2 opacity-80 filter backdrop-blur-lg text-base px-4 py-2 bg-black border border-brand-purple rounded-md flex items-center justify-center text-white font-semibold">
                  <p>
                    <span className="text-brand-pink">{totalMinted}</span> /{' '}
                    {maxSupply}
                  </p>
                </div>

                <img
                  src="/images/crosmo-babies.gif"
                  className="object-cover w-full sm:h-[280px] md:w-[250px] rounded-md"
                />
              </div>

              <div className="flex flex-col items-center w-full px-4 mt-16 md:mt-0">
                <div className="font-coiny flex items-center justify-between w-full">
                  <button
                    className="w-14 h-10 md:w-16 md:h-12 flex items-center justify-center text-brand-background hover:shadow-lg bg-gray-300 font-bold rounded-md"
                    onClick={() => incrementMintAmount()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>

                  <p className="flex items-center justify-center flex-1 grow text-center font-bold text-brand-pink text-3xl md:text-4xl">
                    {mintAmount}
                  </p>

                  <button
                    className="w-14 h-10 md:w-16 md:h-12 flex items-center justify-center text-brand-background hover:shadow-lg bg-gray-300 font-bold rounded-md"
                    onClick={() => decrementMintAmount()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 12H6"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-pink-200 tracking-widest mt-3">
                  Max Mint Amount: {walletLimit}
                </p>

                <div className="border-t border-b py-4 mt-16 w-full">
                  <div className="w-full text-xl font-coiny flex items-center justify-between text-brand-yellow">
                    <p>Total</p>

                    <div className="flex items-center space-x-3">
                      <p>
                        {new Big(totalPrice).div(new Big(10).pow(18)).toFixed(2)}{' '}
                        ETH
                      </p>{' '}
                      <span className="text-gray-400">+ GAS</span>
                    </div>
                  </div>
                </div>

                {/* Mint Button && Connect Wallet Button */}
                {wallet ? (
                  <button
                    className={` ${
                      paused || isMinting
                        ? 'bg-gray-900 cursor-not-allowed'
                        : 'bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg hover:shadow-pink-400/50'
                    } font-coiny mt-12 w-full px-6 py-3 rounded-md text-2xl text-white  mx-4 tracking-wide uppercase`}
                    disabled={paused || isMinting}
                    onClick={() => mint()}
                  >
                    {isMinting ? 'Minting...' : 'Mint'}
                  </button>
                ) : (
                  <button
                    className="font-coiny mt-12 w-full bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg px-6 py-3 rounded-md text-2xl text-white hover:shadow-pink-400/50 mx-4 tracking-wide uppercase"
                    onClick={() => connect()}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            {status && (
              <div
                className={`border ${
                  status.success ? 'border-green-500' : 'border-brand-pink-400 '
                } rounded-md text-start h-full px-4 py-4 w-full mx-auto mt-8 md:mt-4"`}
              >
                <p className="flex flex-col space-y-2 text-white text-sm md:text-base break-words ...">
                  {status.message}
                </p>
              </div>
            )}

            {/* Contract Address */}
            <div className="border-t border-gray-800 flex flex-col items-center mt-10 py-2 w-full">
              <h3 className="font-coiny text-2xl text-brand-pink uppercase mt-6">
                Contract Address
              </h3>
              <a
                href={`https://rinkeby.etherscan.io/address/${config.contractAddress}#readContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 mt-4"
              >
                <span className="break-all ...">{config.contractAddress}</span>
              </a>
              <div className="text-gray-400 mt-4">
                Total Minted: {totalMinted} | Max Supply: {maxSupply}{!!wallet &&` | Wallet Limit: ${walletLimit}`}
              </div>
              <div className='flex flex-row mt-4 gap-4'>
                <img src='/images/etherscan.png' width={40} height={40}/>
                <img src='/images/opensea.svg' width={40} height={40}/>
                <img src='/images/discord.png' width={40} height={40}/>
                <img src='/images/twitter.png' width={40} height={40}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

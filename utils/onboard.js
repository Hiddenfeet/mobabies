import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import coinbaseModule from '@web3-onboard/coinbase'
import fortmaticModule from '@web3-onboard/fortmatic'

// import CrosmoIcon from './cr_max.png'

const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL

const fortmatic = fortmaticModule({
  apiKey: process.env.NEXT_PUBLIC_FORTMATIC_KEY
})

const injected = injectedModule()
const walletConnect = walletConnectModule()
const coinbaseWallet = coinbaseModule()

const initOnboard = init({
  wallets: [walletConnect, coinbaseWallet, injected, fortmatic],
  chains: [
    
    // {
    //   id: '0x152',
    //   token: 'TCRO',
    //   label: 'Cronos Test Network',
    //   rpcUrl: "https://evm-t3.cronos.org"
    // },
    {
      id: '0x19',
      token: 'CRO',
      label: 'Cronos Network',
      rpcUrl: "https://evm.cronos.org"
    }
    // {
    //   id: '0x89',
    //   token: 'MATIC',
    //   label: 'Matic Mainnet',
    //   rpcUrl: 'https://matic-mainnet.chainstacklabs.com'
    // }
  ],
  appMetadata: {
    name: 'CrosmoBabies',
    icon: '/images/cr_max.png',
    description: 'We are some Crosmo Naut.',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' },
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
    ],
    agreement: {
      version: '1.0.0',
      termsUrl: 'https://www.blocknative.com/terms-conditions',
      privacyUrl: 'https://www.blocknative.com/privacy-policy'
    },
  }
})

export { initOnboard }

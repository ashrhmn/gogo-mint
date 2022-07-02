import { useEtherBalance, useEthers } from '@usedapp/core'
import { getChainById } from '@usedapp/core/dist/esm/src/helpers'
import { formatEther } from 'ethers/lib/utils'
import { NextPage } from 'next'
import React from 'react'

const WalletPage: NextPage = () => {
    const { activateBrowserWallet, account, deactivate, chainId } = useEthers()
    const etherBalance = useEtherBalance(account)
    return (
        <div>
            <div>Account : {account}</div>
            <div>Network : {chainId}</div>
            <div>Ether Balance : {etherBalance ? (+formatEther(etherBalance)).toFixed(4) : "-"}</div>
            <div>
                <button onClick={activateBrowserWallet}>Connect</button>
                <button onClick={deactivate}>Disconnect</button>
            </div>
        </div>
    )
}

export default WalletPage
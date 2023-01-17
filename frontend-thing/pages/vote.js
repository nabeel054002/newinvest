import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, {useState, useRef, useEffect} from "react";
import {Contract, providers, BigNumber, utils} from "ethers";
import Web3Modal, { local } from "web3modal";
import {AMF_ADDRESS, AMF_ABI} from "../constants/index.js";

export default function Home() {

    const web3ModalRef = useRef()
  
    const [walletConnected, setWalletConnected] =  useState(false);
    const [userBalance, setUserBalance] = useState(0);
    const [address, setAddress] = useState("");
    const [proposals, setProposals] = useState([]);
    const [deadline_size, setDeadline_size] = useState(0);
  
    const getProviderOrSigner = async (needSigner = false) => {
      // Connect to Metamask
      // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
  
      // If user is not connected to the Rinkeby network, let them know and throw an error
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 80001) {
        window.alert("Change the network to Mumbai");
        throw new Error("Change network to Mumbai");
      }
  
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    };
  
    const connectWallet = async()=>{
      try{
        await getProviderOrSigner();
        setWalletConnected(true);
      }
      catch(err){
        console.error(err);
      }
    }
    useEffect(()=>{
      if(!walletConnected){
        web3ModalRef.current = new Web3Modal({
          network:"matic",
          providerOptions: {},
          disableInjectedProvider: false,
        })
        connectWallet().then(()=>{
          getSigner();
          getProposals();
        });
      }
    }, [])

    const getSigner = async ()=>{
      const signer = await getProviderOrSigner(true);
      const signerAddress = await signer.getAddress();
      setAddress(signerAddress);
    }

    const getProposals = async()=>{
      const provider = await getProviderOrSigner();
      const amfContract=new Contract(AMF_ADDRESS, AMF_ABI, provider);
      const localDeadlines = await amfContract.deadline_size();
      // await localDeadlines.wait()
      let localProposals=[];
      let n = parseInt(localDeadlines.toString())
      for(let i=0; i<n; i++){
        let addressProposal = await amfContract.deadline(i);
        let proposal = await amfContract.proposals(addressProposal);
        localProposals.push(proposal);
      }
      setProposals(localProposals)
    }
  
    const getUserBalance = async ()=>{
      const signer = await getProviderOrSigner(true);
      const addressSigner = await signer.getAddress();
      const amfContract = new Contract(AMF_ADDRESS, AMF_ABI, signer);
      const balance = await amfContract.balances(addressSigner);
      setUserBalance(parseInt(balance.toString()));
    }

    const vote = async (tokenAddress, Vote)=>{
      const signer = await getProviderOrSigner(true);
      const amfContract = new Contract(AMF_ADDRESS, AMF_ABI, signer);
      const vote = Vote==="y"?1:0;

      const tx = await amfContract.voteOnProposal(tokenAddress, vote);//function voteOnProposal(address _tokenAddress, Vote vote)public
      await tx.wait();

    }
    
    function renderVoteTab(){
        return (<div>asudiabsbduaiusb</div>)
    }
  
    return (
      <div className={styles.main}>
      {renderVoteTab()}
      {console.log(proposals)}
      <div>{proposals.map((item, p)=>(
            <div key={p} className={styles.proposal}>
              <div>{item.tokenName}</div>
              <div>{item.tokenAddress}</div>
              {console.log(item)}
              <div>
              People for yes: {item.peopleForYes.toString()}&emsp;
              People for no: {item.peopleForNay.toString()}
              </div>
              <div>
                Votes for Yes: {item.votesForYes.toString()}&emsp;
                Votes for No: {item.votesForNo.toString()}
              </div>
              
              {/* uint256 peopleForYes;
        uint256 peopleForNay;
        uint256 votesForYes;
        uint256 votesForNo; */}
              <div>
              <button onClick={()=>vote(item.tokenAddress, "y")}>Vote for yes!</button>
              <button onClick={()=>vote(item.tokenAddress, "n")}>Vote for no!</button>
              </div>
            </div>
          ))}</div>
      </div>

    )
  }
  
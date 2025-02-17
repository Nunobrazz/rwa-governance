
import pkg from 'hardhat';
const { ethers, utils } = pkg;
import fs from "fs";
//import { string } from 'hardhat/internal/core/params/argumentTypes';

const ProposalState = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed"
};

export const VoteType = {
  "Against": 0,
  "For" : 1,
  "Abstain": 2
}
export const VoteTypeReverse = {
  0 : "Against",
  1 : "For",
  2 : "Abstain"
};

let ProposalIdToProposal = {};

export async function addressToName(address){
  let addr;
  if (typeof address === "string") {
    addr = address;
  } else {
    addr = address.address;
  }

  let signers = await ethers.getSigners()

  if (addr === signers[0].address){
    return "Operator"
  }  
  if (addr === signers[1].address){
    return "Government"
  }
  if (addr === signers[2].address){
    return "Alice"
  }
  if (addr === signers[3].address){
    return "Bob"
  }
  if (addr === signers[4].address){
    return "Charlie"
  }
  if (addr === signers[5].address){
    return "Tenant"
  }
  else{
    return "Unknown"
  }

}
export async function deployContracts() {
  const [Operator, Government] = await ethers.getSigners();

  console.log("---------- Deploy Contracts ----------");
  
  console.log("Deploying Contracts with operator address:", Operator.address);
  console.log("Deploying Contracts with Government address:", Government.address);

  // Deploy RWAToken
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const rwaToken = await RWAToken.deploy("NULL");

  console.log("RWAToken deployed at:", rwaToken.target);

  // Deploy Issuer
  const Issuer = await ethers.getContractFactory("Issuer");
  const issuer = await Issuer.connect(Government).deploy(rwaToken.target);
  console.log("Issuer contract deployed at:", issuer.target);

  // set Issuer
  await rwaToken.setIssuer(issuer.target)

  return {
    rwaToken : rwaToken,
    issuer : issuer
  }
}

export async function issueToken(issuerEntity, rwaToken, issuer, to, uri, amount) {

  console.log("---------- Issuing", uri, "----------");

  const [, Government] = await ethers.getSigners();
	let tokenId;


  // Issue
 	const issue0Tx = await issuer.connect(issuerEntity).issue(to, amount, uri);
	const issue0Receipt = await issue0Tx.wait();

	issue0Receipt.logs.forEach(event => {
		if (event.fragment && event.fragment.name === "IssuedAsset"){
			tokenId = event.args.tokenId
		}

	});
	

  // Deploy Governor
  const Governor = await ethers.getContractFactory("contracts/RWAGovernor.sol:RWAGovernor");
  const governor = await Governor.connect(Government).deploy(rwaToken.target, tokenId);
  console.log("RWAGovernor contract deployed at:", governor.target);
  
  // SmartRent
  const SmartRent = await ethers.getContractFactory("SmartRent");
  const smartRent = await SmartRent.deploy(rwaToken.target, tokenId, governor.target);
  console.log("SmartRent contract deployed at:", smartRent.target);



  return {
    tokenId : tokenId,
    governor : governor,
    smartRent : smartRent
  }
}

export async function transfer(from, to, rwaToken, tokenId, amount) {
  await rwaToken.connect(from).safeTransferFrom(from, to, tokenId, amount, "0x");
  console.log(await addressToName(from), "--", amount, "-->", await addressToName(to));
}

export async function balances(accounts, rwaToken, tokenId) {
 
  console.log("---------- Balances Token ID:", Number(tokenId), "----------");
  for (let i = 0; i < accounts.length; i++) {
    const balance = await rwaToken.connect(accounts[i]).balanceOf(accounts[i], tokenId);
    console.log(await addressToName(accounts[i]), ": ", Number(balance));
  }
}

export async function claimVotingPower(claimer, rwaToken, tokenId) {

  const votesContractAddress = await rwaToken.connect(claimer).getVotesContractAddress(tokenId);
  const votes = await ethers.getContractAt("VotesTokenId", votesContractAddress);

  const tx = await votes.connect(claimer).claimVotingPower(); 
  const txReceipt = await tx.wait(); 

  for (let i = 0; i < txReceipt.logs.length; i++) {
    const event = txReceipt.logs[i];
    if (event.fragment && event.fragment.name === "DelegateVotesChanged") {
      const name = await addressToName(claimer);
      console.log(name, "voting Power updated", Number(event.args[1]), "----->", Number(event.args[2]));
    }
  }
}

export async function votingPower(accounts, rwaToken, tokenId) {

  const votesContractAddress = await rwaToken.connect(accounts[0]).getVotesContractAddress(tokenId);
  const votes = await ethers.getContractAt("VotesTokenId", votesContractAddress);

  console.log("---------- Voting Power Token ID:", Number(tokenId), "----------");
  for (let i = 0; i < accounts.length; i++) {
    const vp = await votes.connect(accounts[i]).getVotes(accounts[i]);
    console.log(await addressToName(accounts[i]), ": ", Number(vp));
  }

}


export async function makeProposal(proposer, governor, targets, values, calldatas, description){

  const tx = await governor.connect(proposer).propose(targets, values, calldatas, description);
  const txReceipt = await tx.wait();
  let proposalId;
  for (let i = 0; i < txReceipt.logs.length; i++) {
    const event = txReceipt.logs[i];
    if (event.fragment && event.fragment.name === "ProposalCreated") {
      proposalId = event.args.proposalId
      ProposalIdToProposal[proposalId] = [targets, values, calldatas, description]
      console.log("---------- NEW Proposal by:", await addressToName(proposer), "----------");
      console.log("Proposal ID:", proposalId);
      console.log("Description:", event.args.description);
      console.log("Targets:", event.args.targets);
      console.log("Values:", values); // hard to obtain
      console.log("Calldatas:", event.args.calldatas);
      console.log("Signatures:", event.args.signatures);
      console.log("Vote Start:", Number(event.args.voteStart));
      console.log("Vote End:", Number(event.args.voteEnd));
    }
  }
  return  proposalId;

}

export async function getProposalState(governor, proposalId) {
  const state = await governor.state(proposalId)
  console.log("---------- Proposal State:", ProposalState[Number(state)], "----------")
}


export async function castVote(voter, governor, proposalId, support){

  const tx = await governor.connect(voter).castVote(proposalId, support);
  const txReceipt = await tx.wait();

  for (let i = 0; i < txReceipt.logs.length; i++) {
    const event = txReceipt.logs[i];
    if (event.fragment && event.fragment.name === "VoteCast") {

      console.log("---------- Casted Vote ----------");
      console.log("Proposal:", ProposalIdToProposal[proposalId][3])
      console.log("Voter:", await addressToName(voter))
      console.log("Support:", VoteTypeReverse[event.args[2]])
      console.log("Weight:", Number(event.args[3]))
    }
  }
}

export async function advanceTime(blocksToMine) {
  // Simulate passage of 1 week (7 days)
  for (let i = 0; i < blocksToMine; i++) {
    await network.provider.send("evm_mine");
  }
  console.log("---------- Current Block:", await ethers.provider.getBlockNumber(), "----------" )
}

export async function executeProposal(governor, proposalId){

  const targets = ProposalIdToProposal[proposalId][0]
  const values = ProposalIdToProposal[proposalId][1]
  const calldatas = ProposalIdToProposal[proposalId][2]
  const description = ProposalIdToProposal[proposalId][3]
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

  const tx = await governor.execute(targets, values, calldatas, descriptionHash);
  const txReceipt = await tx.wait();
  
  for (let i = 0; i < txReceipt.logs.length; i++) {
    const event = txReceipt.logs[i];
    if (event.fragment && event.fragment.name === "ProposalExecuted") {
      console.log("----------", ProposalIdToProposal[event.args.proposalId][3], "Executed ----------");
    }
  }
}

export function encodeCalldata(abiFilePath, func, args){

  const jsonData = fs.readFileSync(abiFilePath, "utf8");
  const abi = JSON.parse(jsonData).abi; 

  const iface = new ethers.Interface(abi);
  const calldata = iface.encodeFunctionData(func, args);

  return calldata;

}


//module.exports = { deployContracts, issueToken, transfer, balances, claimVotingPower, votingPower};
import pkg from 'hardhat';
const { ethers } = pkg;

import { VoteType, deployContracts, issueToken, transfer, balances, claimVotingPower, votingPower, makeProposal, getProposalState, castVote, advanceTime, executeProposal, encodeCalldata, addressToName } from './Deployments.mjs';



async function main(){

  const [operator, Government , Alice, Bob, Charlie, Tenant] = await ethers.getSigners();
  
  const { rwaToken, issuer} = await deployContracts();
  
  let {tokenId, governor, smartRent} = await issueToken(Government, rwaToken, issuer, Alice, "House 1", 1000)

  await smartRent.on('NewLeaseAgreement', (_tenant, _rent, _paymentDates, _leasePeriodEnd)  => {
    console.log('New lease agreement event received!');
    console.log('Tenant:', _tenant);
    console.log('Rent:', _rent);
    console.log('Payment Dates:', _paymentDates);
    console.log('Lease Period End:', _leasePeriodEnd);
  });

  await balances([Alice, Bob, Charlie], rwaToken, tokenId);

  await transfer(Alice, Bob, rwaToken, tokenId, 300)
  await transfer(Alice, Charlie, rwaToken, tokenId, 250)
  await balances([Alice, Bob, Charlie], rwaToken, tokenId);

  await votingPower([Alice, Bob, Charlie], rwaToken, tokenId);
  await claimVotingPower(Alice, rwaToken, tokenId);
  await transfer(Alice, Bob, rwaToken, tokenId, 50)
  await votingPower([Alice, Bob, Charlie], rwaToken, tokenId);
  await claimVotingPower(Bob, rwaToken, tokenId);
  await claimVotingPower(Charlie, rwaToken, tokenId);
  await votingPower([Alice, Bob, Charlie], rwaToken, tokenId);


  let calldata = encodeCalldata("./artifacts/contracts/RWAGovernor.sol/RWAGovernor.json", "setTarget", [smartRent.target]);

  let proposalId = await makeProposal(Bob, governor, [governor], [0], [calldata], "Proposal #1: Add Smart Rent contract to targets.");


  await getProposalState(governor, proposalId)

  await castVote(Alice, governor, proposalId, VoteType["For"])
  await transfer(Alice, Charlie, rwaToken, tokenId, 50)
  await claimVotingPower(Charlie, rwaToken, tokenId);
  await castVote(Bob, governor, proposalId, VoteType["Against"])
  await castVote(Charlie, governor, proposalId, VoteType["For"])

  // Advance 1 hour in number of blocks
  await advanceTime(100);

  await getProposalState(governor, proposalId)
  await executeProposal(governor, proposalId);

  console.log("Is smartRent approved as target: ", await governor.isTargetApproved(smartRent));



  const firstDate = new Date("2025-01-01T00:00:00Z");
  // Convert the specific date to a timestamp (in seconds)
  const firstDateTimestamp = Math.floor(firstDate.getTime() / 1000);

  calldata = encodeCalldata("./artifacts/contracts/use-cases/SmartRent.sol/SmartRent.json", "setLA", [Tenant.address, 100, [firstDateTimestamp, firstDateTimestamp+30*2*24*60*60, firstDateTimestamp+30*3*24*60*60], firstDateTimestamp+30*3*24*60*60 ]);

  proposalId = await makeProposal(Charlie, governor, [smartRent], [0], [calldata], "Proposal #2: Add Tenant to Smart Rent contract.");
  
  await votingPower([Alice, Bob, Charlie], rwaToken, tokenId);
  await castVote(Alice, governor, proposalId, VoteType["For"])
  await castVote(Bob, governor, proposalId, VoteType["For"])
  await castVote(Charlie, governor, proposalId, VoteType["For"])

  // Advance 1 hour in number of blocks
  await advanceTime(100);

  await getProposalState(governor, proposalId)
  await executeProposal(governor, proposalId);


  console.log("Property's new tenant is: ", await addressToName(await smartRent.getTenant())); 


}



main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });

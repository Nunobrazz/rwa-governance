pragma solidity 0.8.24;

import {Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";
import {RWAToken} from "./RWAToken.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";


contract VotesTokenId is Votes{ 

	RWAToken public immutable i_rwaToken;
	uint256 public immutable i_tokenId;

  error UnauthorizedTransfer(address sender);

  constructor(address rwaToken, uint256 tokenId) EIP712("RWAVotingPower", "1"){
    // Get Voting Power from
    i_rwaToken = RWAToken(rwaToken);
    i_tokenId = tokenId;
  }

  /* EOA must request directly to this address*/
  function claimVotingPower() external {
  	address claimer = msg.sender;
    delegate(claimer);
  }

   /* reads from RWAToken contract */
  function _getVotingUnits(address account) override internal view returns (uint256){
  	return i_rwaToken.balanceOf(account, i_tokenId);
  }
  	
  function getVotingUnits(address account) public view returns (uint256){
  	return _getVotingUnits(account);
  }

  function transferVotingUnits(address from, address to, uint256 value) external {
    if (msg.sender != address(i_rwaToken)){
      revert UnauthorizedTransfer(msg.sender);
    }
    _transferVotingUnits(from, to, value);
  }

  
}

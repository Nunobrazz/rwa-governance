pragma solidity 0.8.24;

import {RWAGovernor} from "./RWAGovernor.sol";
import {VotesTokenId} from "./VotesTokenId.sol";
import {Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {RWAToken} from "./RWAToken.sol";
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";


contract RWAGovernor is Governor, GovernorCountingSimple{ 

   RWAToken public immutable i_rwaToken;
   uint256 public immutable i_tokenId;

   mapping(address => bool) public approvedTargets;
   
   event NewTargetSet(address target);

   error TargetNotApproved(address target, uint256 amount, bytes theCalldata);
   error NotItself(address sender);
   error ERC6372InconsistentClock();


  constructor(address rwaToken, uint256 tokenId) 
      Governor("RWAGovernor") 
      GovernorCountingSimple(){
         
      approvedTargets[address(this)] = true;

      // The Governed
      i_rwaToken = RWAToken(rwaToken);
      i_tokenId = tokenId;
   }

   function setTarget(address target) public onlyGovernance{
      approvedTargets[target] = true;
      emit NewTargetSet(target);
   } 


   function isTargetApproved(address target) public view returns (bool){
      return approvedTargets[target];
   } 


   function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) override public virtual returns (uint256) {

         address proposer = _msgSender();

        // check description restriction
         if (!_isValidDescriptionForProposer(proposer, description)) {
            revert GovernorRestrictedProposer(proposer);
         }
         for (uint i = 0; i < targets.length; i++) {
            if (! approvedTargets[targets[i]]) {
               revert TargetNotApproved(targets[i], values[i], calldatas[i]);
            }
         }
        // check proposal threshold
        uint256 votesThreshold = proposalThreshold();
        if (votesThreshold > 0) {
            uint256 proposerVotes = getVotes(proposer, clock() - 1); 
            if (proposerVotes < votesThreshold) {
               revert GovernorInsufficientProposerVotes(proposer, proposerVotes, votesThreshold);
            }
        }
        return _propose(targets, values, calldatas, description, proposer);
    } 

   /* How long after a proposal is created should voting power be fixed */
   function votingDelay() override public pure virtual returns (uint256) {
      return 0;
   }

   function votingPeriod() override public pure virtual returns (uint256) {
      return 100 seconds;
   }

   function proposalThreshold() override public pure virtual returns (uint256) {
      return 1;
   }
   
   function _getVotes(address account, uint256 timepoint, bytes memory /*params*/) override internal view virtual returns (uint256) {
      return i_rwaToken.getPastVotes(account, i_tokenId, timepoint);
   }

   function quorum(uint256 /*timepoint*/) override public view virtual returns (uint256){
      return i_rwaToken.totalSupply() * 50 / 100;
   }

    function clock() override public view virtual returns (uint48) {
        return Time.blockNumber();
    }

    function CLOCK_MODE() override public view virtual returns (string memory) {
        // Check that the clock was not modified
        if (clock() != Time.blockNumber()) {
            revert ERC6372InconsistentClock();
        }
        return "mode=blocknumber&from=default";
    }

}

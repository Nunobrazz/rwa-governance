// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155Supply, ERC1155} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {VotesTokenId} from "./VotesTokenId.sol";


contract RWAToken is ERC1155Supply, Ownable {
    address internal s_issuer;

    // Optional mapping for token URIs id to ipfs hash
    mapping(uint256 tokenId => string) private _tokenURIs;
    mapping(uint256 tokenId => VotesTokenId) private _votingPower;

    event SetIssuer(address indexed issuer);

    error ERC1155Core_CallerIsNotIssuer(address msgSender);

    modifier onlyIssuer() { 
        if (msg.sender != s_issuer) {
            revert ERC1155Core_CallerIsNotIssuer(msg.sender);
        }
        _;
    }

    // Used as the URI for all token types by relying on ID substitution, e.g. https://token-cdn-domain/{id}.json
    constructor(string memory uri_) 
        ERC1155(uri_) 
        Ownable(msg.sender) 
        {}

    function setIssuer(address _issuer) external onlyOwner {
        s_issuer = _issuer;
        emit SetIssuer(_issuer);
    }

    function getVotesContractAddress(uint256 id) external view returns (address) {
        return address(_votingPower[id]);
    }


    function getPastVotes(address account, uint256 id, uint256 timepoint) external view returns (uint256) {
        return _votingPower[id].getPastVotes(account, timepoint);
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data, string memory tokenUri)
        public
        onlyIssuer
    {
        _mint(to, id, amount, data);
        _tokenURIs[id] = tokenUri;
    }

    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data,
        string[] memory _tokenUris
    ) public onlyIssuer {
        _mintBatch(_to, _ids, _amounts, _data);
        for (uint256 i = 0; i < _ids.length; ++i) {
            _tokenURIs[_ids[i]] = _tokenUris[i];
        }
    }

    function burn(address account, uint256 id, uint256 amount) public onlyIssuer {

        if (account != _msgSender() && !isApprovedForAll(account, _msgSender())) {
            revert ERC1155MissingApprovalForAll(_msgSender(), account);
        }

        _burn(account, id, amount);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public onlyIssuer {
        if (account != _msgSender() && !isApprovedForAll(account, _msgSender())) {
            revert ERC1155MissingApprovalForAll(_msgSender(), account);
        }

        _burnBatch(account, ids, amounts);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];

        return bytes(tokenURI).length > 0 ? tokenURI : super.uri(tokenId);
    }

    function _setURI(uint256 tokenId, string memory tokenURI) internal {
        _tokenURIs[tokenId] = tokenURI;
        emit URI(uri(tokenId), tokenId);
    }

    /* update voting power accordingly */
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) override internal virtual {
        super._update(from, to, ids, values);
        if (from == address(0)){
            for (uint256 i = 0; i < ids.length; ++i) {
                _votingPower[ids[i]] = new VotesTokenId(address(this), ids[i]);
                _votingPower[ids[i]].transferVotingUnits(from, to, values[i]);
            }
        }
        else{
            for (uint256 i = 0; i < ids.length; ++i) {
                _votingPower[ids[i]].transferVotingUnits(from, to, values[i]);
            }
        }
    }
        
}
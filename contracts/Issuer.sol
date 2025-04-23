// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {RWAToken} from "./RWAToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract Issuer is Ownable {

    RWAToken internal immutable i_rwaToken;

    uint256 private s_nextTokenId;

    event IssuedAsset(address to, string tokenURI, uint256 tokenId, uint256 amount);



    constructor(address rwaToken) Ownable(_msgSender()) {
        i_rwaToken = RWAToken(rwaToken);
    } 


    function issue(address to, uint256 amount, string memory uri) // URI per TokenID
        external 
        onlyOwner
    {
        uint256 tokenId = s_nextTokenId++;
        i_rwaToken.mint(to, tokenId, amount, "", uri);
        emit IssuedAsset(to, uri, tokenId, amount);
    }

}

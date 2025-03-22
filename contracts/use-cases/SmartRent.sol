pragma solidity 0.8.24;

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RWAToken} from "../RWAToken.sol";

contract SmartRent is Context, Ownable { 

  	RWAToken public immutable i_rwaToken;
  	uint256 public immutable i_tokenId;
	address public immutable i_governor;

	address public _tenant;
	uint256 public _rent;
	uint48[] public _paymentDates;
	uint48 public _leasePeriodEnd;


    event NewLeaseAgreement(address _tenant, uint256 rent,uint48[] paymentDates, uint48 leasePeriodEnd);
    event SetRent(uint256 amount);
    event SetTenant(address indexed tenant);
    event SetPaymentDates(uint48[] paymentDates);
    event SetLeasePeriodEnd(uint48 date);


	constructor(address rwaToken, uint256 tokenId, address governor) Ownable(governor) {
		i_rwaToken = RWAToken(rwaToken);
		i_tokenId = tokenId;
		i_governor = governor;
	}
    
	function getTenant() external view returns(address) {
        return _tenant;
    }

	function setLA(address tenant, uint256 rent, uint48[] calldata paymentDates, uint48 date) external onlyOwner {
        _tenant = tenant;
		_rent = rent;
		_paymentDates = paymentDates;
		_leasePeriodEnd = date;
        emit NewLeaseAgreement(_tenant, _rent, _paymentDates, _leasePeriodEnd);
    }

	function setRent(uint256 rent) external onlyOwner {
        _rent = rent;
        emit SetRent(_rent);
    }

	function setTenant(address tenant) external onlyOwner {
        _tenant = tenant;
        emit SetTenant(_tenant);
    }

	function setPaymentDates(uint48[] calldata paymentDates) external onlyOwner {
        _paymentDates = paymentDates;
        emit SetPaymentDates(_paymentDates);
    }

	function setLeasePeriodEnd(uint48 date) external onlyOwner {
        _leasePeriodEnd = date;
        emit SetLeasePeriodEnd(_leasePeriodEnd);
    }

}

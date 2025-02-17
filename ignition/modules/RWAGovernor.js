const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const network = 'fuji';

const rwaTokenAddressFuji = "0x27A9CeDcEF8BeAa2E1a98416a0792506f9bfd164"
const tokenId = 0 // confirmar


module.exports = buildModule("GovernableRWA", (m) => {
  
  if (network == 'fuji'){    
    const ret = m.contract("RWAGovernor", [rwaTokenAddressFuji, tokenId]);
    return { ret };

  }
  else if (network == 'sepolia'){
    const ret = m.contract("RWAGovernor", [rwaTokenAddressFuji, tokenId]);
    return { ret };
  }
});


// (FUJI) GovernableRWA#RWAGovernor - 
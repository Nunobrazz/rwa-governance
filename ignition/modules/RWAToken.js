const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const network = 'fuji';

module.exports = buildModule("GovernableRWA", (m) => {
  
  const rwaToken = m.contract("RWAToken", [""]);
  return { rwaToken };

  if (network == 'fuji'){   
    const ret = m.contract("RWAToken", [""]);
    return { ret };

  }
  else if (network == 'sepolia'){
    const ret = m.contract("RWAToken", ["This is the RWA uri."]);
    return { ret };

  }
});


// (FUJI) GovernableRWA#RWAToken - 0x27A9CeDcEF8BeAa2E1a98416a0792506f9bfd164

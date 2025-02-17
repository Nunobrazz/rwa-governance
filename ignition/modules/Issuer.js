const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const network = 'fuji';

const rwaTokenAddressFuji = "0x27A9CeDcEF8BeAa2E1a98416a0792506f9bfd164"
const functionsRouterAddressFuji = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"


module.exports = buildModule("GovernableRWA", (m) => {
  
  if (network == 'fuji'){    
    const ret = m.contract("Issuer", [rwaTokenAddressFuji, functionsRouterAddressFuji]);
    return { ret };

  }
  else if (network == 'sepolia'){
    const ret = m.contract("Issuer", ["", "", "", "", ""]);
    return { ret };
  }
});


// (FUJI) GovernableRWA#Issuer - 0xC60177fB13d8196A721E76df0Fdb598770aC4505
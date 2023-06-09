import { getGlobalDeploys, getMarketDeploys } from '@lyrafinance/protocol';
import { toBN } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { deployTestSystem } from '@lyrafinance/protocol/dist/test/utils/deployTestSystem';
import { ethers } from 'hardhat';

import { LyraGlobal, LyraMarket } from '@lyrafinance/protocol/dist/test/utils/package/parseFiles';
import { DEFAULT_OPTION_MARKET_PARAMS } from '@lyrafinance/protocol/dist/test/utils/defaultParams';
import { seedTestSystem } from '@lyrafinance/protocol/dist/test/utils/seedTestSystem';

import ERC20ABI from './helpers/abi/ERC20ABI';

// run this script using `yarn hardhat run --network local` if running directly from repo (not @lyrafinance/protocol)
// otherwise OZ will think it's deploying to hardhat network and not local
async function main() {
  // 1. get deployer and network
  const [deployer, lyra, , , owner] = await ethers.getSigners();

  const provider = new ethers.providers.JsonRpcProvider();

  provider.getGasPrice = async () => {
    return ethers.BigNumber.from('0');
  };
  provider.estimateGas = async () => {
    return ethers.BigNumber.from(15000000);
  };
  // max limit to prevent run out of gas errors

  // 2. deploy and seed market
  const exportAddresses = true;
  let localTestSystem = await deployTestSystem(lyra, false, exportAddresses, {
    mockSNX: true,
    compileSNX: false,
    optionMarketParams: { ...DEFAULT_OPTION_MARKET_PARAMS, feePortionReserved: toBN('0.05') },
  });

  await seedTestSystem(lyra, localTestSystem);

  // // 3. add new BTC market
  // let newMarketSystem = await addNewMarketSystem(deployer, localTestSystem, 'sBTC', exportAddresses)
  // await seedNewMarketSystem(deployer, localTestSystem, newMarketSystem)

  // 4. get global contracts
  let lyraGlobal: any = getGlobalDeploys('local');
  const susd = lyraGlobal.QuoteAsset.address;
  const susdAbi = lyraGlobal.QuoteAsset.abi;

  const susdContract = await ethers.getContractAt(susdAbi, susd);
  await susdContract.connect(lyra).mint(deployer.address, toBN('1000000'));
  await susdContract.connect(lyra).mint(owner.address, toBN('100000'));
  // 5. get market contracts
  let lyraMarket: any = getMarketDeploys('local', 'sETH');
  console.log('contract name:', lyraMarket.OptionMarket.contractName);
  console.log('address:', lyraMarket.OptionMarket.address);
  console.log('bytecode:', lyraMarket.OptionMarket.bytecode.slice(0, 20) + '...');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

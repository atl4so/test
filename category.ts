// when modifying categories, you have to restart the service which will delete existing category and re-create them.
// only future classification will take into account the new categories
import { embed } from "./open-ai";
import { qdrant, TWEET_COLLECTION } from "./qdrant";

export type Category =
  | "research"
  | "development"
  | "vprog"
  | "dagknight"
  | "node"
  | "kip_proposals"
  | "l2_builders"
  | "ecosystem"
  | "tools"
  | "community_culture"
  | "education"
  | "mining"
  | "price_talk"
  | "exchange";

// each category can (and should) have multiple centroids (manually certified data)
// the cleaner and accurate data label are, the more accurate the system is
const categoryDescriptions: { id: string; category: Category; text: string }[] =
  [
    //
    // RESEARCH
    // Focus: Papers, theoretical proofs, DAG geometry, consensus logic, academic tone.
    //
    {
      id: "cat_research_1",
      category: "research",
      text: `Analyzing the probabilistic finality in the GhostDAG paper. The formal proof for liveness under 51% attacks is mathematically beautiful.`,
    },
    {
      id: "cat_research_2",
      category: "research",
      text: `The distinction between PHANTOM and GHOSTDAG topological ordering is critical. One prioritizes connectivity, the other linear consistency.`,
    },
    {
      id: "cat_research_3",
      category: "research",
      text: `Modeling block propagation latency against the k-parameter. Theoretical limits suggest we can push block rates higher without breaking security.`,
    },
    {
      id: "cat_research_4",
      category: "research",
      text: `Reading the yellow paper on sub-second finality. The convergence mechanism for DAG tips relies on heavy partial order theory.`,
    },
    {
      id: "cat_research_5",
      category: "research",
      text: `Kaspa's pruning logic is a breakthrough in distributed systems. It solves state bloat mathematically rather than just deleting old data.`,
    },
    {
      id: "cat_research_6",
      category: "research",
      text: `The security assumption of delay-diameter bounds in the DAG is vital for understanding why 100BPS is theoretically safe.`,
    },
    {
      id: "cat_research_7",
      category: "research",
      text: `Studying the anticipatory mining paper. The way it handles selfish mining vectors in a high-throughput DAG is novel.`,
    },
    {
      id: "cat_research_8",
      category: "research",
      text: `Comparing Nakamoto Consensus vs GHOSTDAG: The shift from 'longest chain' to 'heaviest sub-DAG' maximizes security per watt.`,
    },
    {
      id: "cat_research_9",
      category: "research",
      text: `The orthogonality of ordering and data availability in Kaspa's protocol design allows for unique scaling properties.`,
    },
    {
      id: "cat_research_10",
      category: "research",
      text: `Reachability queries in the DAG structure allow for efficient past/future set determination without traversing the whole graph.`,
    },

    //
    // DEVELOPMENT
    // Focus: Code, GitHub, Rust, SDK, compiling, debugging, PRs.
    //
    {
      id: "cat_development_1",
      category: "development",
      text: `Debugged a race condition in the kaspad mempool handler. The Rust compiler caught a lifetime issue in the transaction verifier.`,
    },
    {
      id: "cat_development_2",
      category: "development",
      text: `Submitted a PR to fix the gRPC frame size limit in the Go node. Integration tests are passing, merging to master soon.`,
    },
    {
      id: "cat_development_3",
      category: "development",
      text: `Refactoring the wallet SDK to support WASM. This allows frontend devs to sign transactions in-browser without backend relays.`,
    },
    {
      id: "cat_development_4",
      category: "development",
      text: `The new rusty-kaspa build time is incredible. Parallel compilation of the consensus module is finally working correctly.`,
    },
    {
      id: "cat_development_5",
      category: "development",
      text: `Writing a script to serialize UTXO sets for the new indexer. Handling binary data in the P2P protocol requires strict type checking.`,
    },
    {
      id: "cat_development_6",
      category: "development",
      text: `Just pushed a fix for the Kaspad P2P handshake logic. The Version message was missing a required field.`,
    },
    {
      id: "cat_development_7",
      category: "development",
      text: `Implementing the Borsh serialization for the new RPC endpoints. It's much more efficient than JSON for high-throughput data.`,
    },
    {
      id: "cat_development_8",
      category: "development",
      text: `The unit tests for the Difficulty Adjustment Algorithm (DAA) are failing on edge cases. Need to check the window size parameter.`,
    },
    {
      id: "cat_development_9",
      category: "development",
      text: `Cloned the rusty-kaspa repo to contribute to the pruning module. The code structure is very clean.`,
    },
    {
      id: "cat_development_10",
      category: "development",
      text: `Updated the Go-Kaspa client library. The new SubmitTransaction method now returns a structured error object.`,
    },

    //
    // VPROG
    // Focus: Smart contracts, ZK proofs, off-chain compute, sequencers, opcode.
    //
    {
      id: "cat_vprog_1",
      category: "vprog",
      text: `vProgs allow Kaspa to support smart contracts without clogging L1. Computation happens off-chain, verification happens on the DAG.`,
    },
    {
      id: "cat_vprog_2",
      category: "vprog",
      text: `Exploring Zero-Knowledge proofs for Kaspa. We can anchor state transitions on the blockDAG while keeping execution external.`,
    },
    {
      id: "cat_vprog_3",
      category: "vprog",
      text: `The opcode design for vProgs is efficient. It separates settlement from execution, making it a modular layer for dApps.`,
    },
    {
      id: "cat_vprog_4",
      category: "vprog",
      text: `Building a verifiable program that handles token swaps. The sequencers post proofs to the Kaspa mainnet for finality.`,
    },
    {
      id: "cat_vprog_5",
      category: "vprog",
      text: `Kaspa isn't just currency; with vProgs it becomes a settlement layer for complex logic. It's the PoW answer to scaling.`,
    },
    {
      id: "cat_vprog_6",
      category: "vprog",
      text: `Testing a ZK-Rollup design that posts validity proofs to Kaspa. The throughput of the base layer is perfect for data availability.`,
    },
    {
      id: "cat_vprog_7",
      category: "vprog",
      text: `ScopeGas in vProgs prevents infinite loops. Each off-chain program pays for the verification cost on the mainnet.`,
    },
    {
      id: "cat_vprog_8",
      category: "vprog",
      text: `Writing a smart contract in AssemblyScript that compiles to a Kaspa vProg. The developer experience is similar to WASM.`,
    },
    {
      id: "cat_vprog_9",
      category: "vprog",
      text: `The separation of 'Compute' and 'Verify' in vProgs is genius. L1 stays lean, while L2s can be as complex as needed.`,
    },
    {
      id: "cat_vprog_10",
      category: "vprog",
      text: `Recursive SNARKs could allow vProgs to batch thousands of transactions into a single Kaspa block proof.`,
    },

    //
    // DAGKNIGHT
    // Focus: Consensus parameters, ordering, responsiveness, 10BPS, parameterless.
    //
    {
      id: "cat_dagknight_1",
      category: "dagknight",
      text: `DAGKnight is the first parameterless consensus protocol. It adjusts to network latency dynamically, removing hardcoded block times.`,
    },
    {
      id: "cat_dagknight_2",
      category: "dagknight",
      text: `Simulating DAGKnight ordering on a testnet. The resistance to variable network delay is significantly better than GhostDAG.`,
    },
    {
      id: "cat_dagknight_3",
      category: "dagknight",
      text: `The upgrade to DAGKnight will unlock 10 blocks per second or more. It fundamentally changes how the network agrees on timelines.`,
    },
    {
      id: "cat_dagknight_4",
      category: "dagknight",
      text: `Michael Sutton's work on the DAGKnight mechanism resolves the conflict between high throughput and responsive security.`,
    },
    {
      id: "cat_dagknight_5",
      category: "dagknight",
      text: `Moving from GhostDAG to DAGKnight is like upgrading from 4G to 5G. The consensus engine becomes adaptive to real-time internet conditions.`,
    },
    {
      id: "cat_dagknight_6",
      category: "dagknight",
      text: `DAGKnight uses a 'virtual' k-parameter that adjusts based on the observed network diameter.`,
    },
    {
      id: "cat_dagknight_7",
      category: "dagknight",
      text: `The ordering of the DAG in DAGKnight is robust even under 50% packet loss scenarios.`,
    },
    {
      id: "cat_dagknight_8",
      category: "dagknight",
      text: `Waiting for the rust rewrite to fully implement DAGKnight. The consensus logic is much more complex than GHOSTDAG.`,
    },
    {
      id: "cat_dagknight_9",
      category: "dagknight",
      text: `DAGKnight minimizes the confirmation times automatically as network hardware improves over time.`,
    },
    {
      id: "cat_dagknight_10",
      category: "dagknight",
      text: `The 'Knight' in DAGKnight refers to its ability to move and adapt on the graph structure dynamically.`,
    },

    //
    // NODE
    // Focus: kaspad, syncing, pruning, storage, bandwidth, RPC, peers.
    //
    {
      id: "cat_node_1",
      category: "node",
      text: `My node storage is full. Enabling pruning mode to reduce the disk footprint from 500GB down to 20GB.`,
    },
    {
      id: "cat_node_2",
      category: "node",
      text: `Setting up a high-performance public node. Configured Nginx as a reverse proxy for the RPC port to handle 10k requests.`,
    },
    {
      id: "cat_node_3",
      category: "node",
      text: `Syncing a fresh node from scratch took only 2 hours. The IBD (Initial Block Download) performance on Rust is insane.`,
    },
    {
      id: "cat_node_4",
      category: "node",
      text: `Running a Kaspa archive node to index the entire history. You need decent NVMe SSDs to keep up with the IOPS.`,
    },
    {
      id: "cat_node_5",
      category: "node",
      text: `My node peered with 50 others instantly. Port forwarding 16111 is crucial for good connectivity and network health.`,
    },
    {
      id: "cat_node_6",
      category: "node",
      text: `The kaspad process is using too much RAM. Tweaking the cache size in the config file to optimize for a 16GB server.`,
    },
    {
      id: "cat_node_7",
      category: "node",
      text: `Getting 'orphan block' warnings in the node logs. Check your internet connection latency.`,
    },
    {
      id: "cat_node_8",
      category: "node",
      text: `Is anyone else having trouble querying the UTXO set via gRPC? My node says it is fully synced.`,
    },
    {
      id: "cat_node_9",
      category: "node",
      text: `Deployed a node on AWS using the Docker image. The docker-compose setup for rusty-kaspa is plug-and-play.`,
    },
    {
      id: "cat_node_10",
      category: "node",
      text: `Checking get_block_dag_info on my local node. The tip count is fluctuating correctly.`,
    },

    //
    // KIP PROPOSALS
    // Focus: Governance, KIP-#, voting, standards, community review.
    //
    {
      id: "cat_kip_1",
      category: "kip_proposals",
      text: `Reviewing KIP-13 regarding the adjustment of the difficulty adjustment algorithm. We need community consensus before merging.`,
    },
    {
      id: "cat_kip_2",
      category: "kip_proposals",
      text: `There is a new proposal on the forum to standardize the rust-sdk wallet addresses. This KIP needs developer attention.`,
    },
    {
      id: "cat_kip_3",
      category: "kip_proposals",
      text: `The emission schedule is hardcoded, but KIPs allow us to upgrade the utility layers around it. Governance is off-chain but impactful.`,
    },
    {
      id: "cat_kip_4",
      category: "kip_proposals",
      text: `Voting on the new KIP for color-coded transactions in the visualizer. It's a minor change but requires protocol standardization.`,
    },
    {
      id: "cat_kip_5",
      category: "kip_proposals",
      text: `KIP-10 discussion is heating up. The debate over minimum fee requirements is essential for preventing dust attacks.`,
    },
    {
      id: "cat_kip_6",
      category: "kip_proposals",
      text: `Has the community reached a verdict on KIP-9? The forum thread has over 200 replies.`,
    },
    {
      id: "cat_kip_7",
      category: "kip_proposals",
      text: `Drafting a new KIP to define a standard for Kaspa URI schemes (e.g., kaspa:address?amount=...).`,
    },
    {
      id: "cat_kip_8",
      category: "kip_proposals",
      text: `KIPs are how we coordinate upgrades without a central foundation dictating changes.`,
    },
    {
      id: "cat_kip_9",
      category: "kip_proposals",
      text: `The technical committee just approved KIP-11 for the new indexer API specification.`,
    },
    {
      id: "cat_kip_10",
      category: "kip_proposals",
      text: `Read the KIP proposal before you vote. Understanding the technical trade-offs is your responsibility.`,
    },

    //
    // L2 BUILDERS
    // Focus: Rollups, bridges, dApps using Kaspa, tokens on Kaspa (KRC-20), payments.
    //
    {
      id: "cat_l2_builders_1",
      category: "l2_builders",
      text: `Launching a new payment gateway that settles on Kaspa. Merchants can accept KAS with 1-second finality using our API.`,
    },
    {
      id: "cat_l2_builders_2",
      category: "l2_builders",
      text: `Developing a rollup on top of Kaspa. We use the L1 for data availability and sequencing, but execution is EVM compatible.`,
    },
    {
      id: "cat_l2_builders_3",
      category: "l2_builders",
      text: `The KRC-20 token standard is growing. Builders are deploying tokens and NFTs directly on the DAG using the new protocol.`,
    },
    {
      id: "cat_l2_builders_4",
      category: "l2_builders",
      text: `Bridging assets from Ethereum to Kaspa. The wrapped token contract is audited and ready for the mainnet launch.`,
    },
    {
      id: "cat_l2_builders_5",
      category: "l2_builders",
      text: `My team is building a decentralized exchange (DEX) that leverages Kaspa's speed. Order books are off-chain, settlement is on-chain.`,
    },
    {
      id: "cat_l2_builders_6",
      category: "l2_builders",
      text: `Integrated Kaspa into our e-commerce plugin. Now Shopify stores can accept KAS natively.`,
    },
    {
      id: "cat_l2_builders_7",
      category: "l2_builders",
      text: `Building a stablecoin protocol that uses KAS as over-collateralized reserve. The L2 logic handles the peg.`,
    },
    {
      id: "cat_l2_builders_8",
      category: "l2_builders",
      text: `The Kasplex indexer is live. You can now build apps that query KRC-20 balances instantly.`,
    },
    {
      id: "cat_l2_builders_9",
      category: "l2_builders",
      text: `Developing a 'Lightning Network' style channel for Kaspa for micro-payments, though L1 is already fast enough for most.`,
    },
    {
      id: "cat_l2_builders_10",
      category: "l2_builders",
      text: `Our project is the first GameFi app launching on the Kaspa ecosystem.`,
    },

    //
    // ECOSYSTEM
    // Focus: Partnerships, adoption, grants, ecosystem map, integrators, marketing events.
    //
    {
      id: "cat_ecosystem_1",
      category: "ecosystem",
      text: `Big news: Tangem wallet now fully supports Kaspa. Hardware wallet support is a major milestone for ecosystem security.`,
    },
    {
      id: "cat_ecosystem_2",
      category: "ecosystem",
      text: `Kaspa is gaining traction in the checkout systems of online retailers. Real-world adoption is happening faster than expected.`,
    },
    {
      id: "cat_ecosystem_3",
      category: "ecosystem",
      text: `The ecosystem landscape map has been updated. We now have 40+ active projects ranging from wallets to payment processors.`,
    },
    {
      id: "cat_ecosystem_4",
      category: "ecosystem",
      text: `Attending the crypto conference to represent the Kaspa ecosystem. Lots of interest from VCs and integrators.`,
    },
    {
      id: "cat_ecosystem_5",
      category: "ecosystem",
      text: `A new major payment provider integrated KAS. This opens up millions of merchants to instant PoW payments.`,
    },
    {
      id: "cat_ecosystem_6",
      category: "ecosystem",
      text: `The Kaspa Ambassador Program is launching to help spread adoption in local regions.`,
    },
    {
      id: "cat_ecosystem_7",
      category: "ecosystem",
      text: `Just saw a KAS ATM in the wild! Physical infrastructure is key for ecosystem growth.`,
    },
    {
      id: "cat_ecosystem_8",
      category: "ecosystem",
      text: `Collaborating with Travala to allow booking flights with Kaspa. Utility is king.`,
    },
    {
      id: "cat_ecosystem_9",
      category: "ecosystem",
      text: `The Foundation just approved a grant for a new marketing initiative to onboard web2 users.`,
    },
    {
      id: "cat_ecosystem_10",
      category: "ecosystem",
      text: `Kaspa's ecosystem is expanding into the gaming sector with this new partnership.`,
    },

    //
    // TOOLS
    // Focus: Explorers, converters, faucets, visualizers, calculators, wallets (software).
    //
    {
      id: "cat_tools_1",
      category: "tools",
      text: `The new block explorer is live. It shows the DAG topology in 3D and highlights the blue score of every block.`,
    },
    {
      id: "cat_tools_2",
      category: "tools",
      text: `I built a simple tool to calculate optimal mining fees based on current network congestion. Check it out on GitHub.`,
    },
    {
      id: "cat_tools_3",
      category: "tools",
      text: `Kaspa-Graph-Inspector (KGI) is the best way to debug split blocks. The visualizer helps you see where the orphans are.`,
    },
    {
      id: "cat_tools_4",
      category: "tools",
      text: `Updated the faucet to dispense testnet coins. Developers can now request 1000 KAS per day for testing.`,
    },
    {
      id: "cat_tools_5",
      category: "tools",
      text: `This transaction decoder tool is a lifesaver. Paste the hex string and it parses the inputs and outputs instantly.`,
    },
    {
      id: "cat_tools_6",
      category: "tools",
      text: `Just downloaded the Kaspium wallet. The UI is sleek and the QR code scanner is very fast.`,
    },
    {
      id: "cat_tools_7",
      category: "tools",
      text: `Using the 'Kaspa-calc' website to estimate my mining rewards based on hashrate.`,
    },
    {
      id: "cat_tools_8",
      category: "tools",
      text: `Is there a tool to export my transaction history to CSV for tax purposes?`,
    },
    {
      id: "cat_tools_9",
      category: "tools",
      text: `The network visualizer looks like a biological organism. Watching the blocks spawn is mesmerizing.`,
    },
    {
      id: "cat_tools_10",
      category: "tools",
      text: `Created a Telegram bot that alerts you when a specific address moves funds. Useful tool for whales.`,
    },

    //
    // COMMUNITY_CULTURE
    // Focus: Vibes, maxis, fair launch, memes, hodl, shilling, emotional support.
    //
    {
      id: "cat_community_culture_1",
      category: "community_culture",
      text: `The fair launch ethos of Kaspa is what keeps me here. No VC allocation, no premine, just pure community energy.`,
    },
    {
      id: "cat_community_culture_2",
      category: "community_culture",
      text: `Diamond hands only. If you can't handle the volatility, you don't deserve the 100x. #KAS`,
    },
    {
      id: "cat_community_culture_3",
      category: "community_culture",
      text: `Me watching the blockDAG visualization instead of working. It's hypnotic. The 'Tetris' of money.`,
    },
    {
      id: "cat_community_culture_4",
      category: "community_culture",
      text: `Kaspa solves the trilemma. Bitcoin was the prototype, Kaspa is the finished product. Change my mind.`,
    },
    {
      id: "cat_community_culture_5",
      category: "community_culture",
      text: `Checking the price every 5 seconds won't make the DAG faster. Go touch grass, the blocks will keep flowing.`,
    },
    {
      id: "cat_community_culture_6",
      category: "community_culture",
      text: `The Kaspa community reminds me of early 2013 Bitcoin. High intellect, low hype, pure tech focus.`,
    },
    {
      id: "cat_community_culture_7",
      category: "community_culture",
      text: `GM Kaspa fam! Let's mine some blocks and disrupt the financial system today.`,
    },
    {
      id: "cat_community_culture_8",
      category: "community_culture",
      text: `You don't choose Kaspa, Kaspa chooses you. The Silver to Bitcoin's Gold? No, the Cash to Bitcoin's Gold.`,
    },
    {
      id: "cat_community_culture_9",
      category: "community_culture",
      text: `Wen Binance? Stop asking. We build, they come to us. That is the Kaspa way.`,
    },
    {
      id: "cat_community_culture_10",
      category: "community_culture",
      text: `I sold my car to buy more KAS. (Not financial advice, I just really like the DAG).`,
    },

    //
    // EDUCATION
    // Focus: Explainers, history, tutorials, "how-to", comparisons, definitions.
    //
    {
      id: "cat_education_1",
      category: "education",
      text: `A thread on the history of Yonatan Sompolinsky's work. From the GHOST protocol in 2013 to modern Kaspa.`,
    },
    {
      id: "cat_education_2",
      category: "education",
      text: `Tutorial: How to set up a Kaspa paper wallet. Step-by-step guide for cold storage beginners.`,
    },
    {
      id: "cat_education_3",
      category: "education",
      text: `Explaining the difference between 'block rate' and 'confirmation time'. High block rate aids security, it doesn't just mean speed.`,
    },
    {
      id: "cat_education_4",
      category: "education",
      text: `What is a UTXO? Understanding the unspent transaction output model used by Bitcoin and Kaspa.`,
    },
    {
      id: "cat_education_5",
      category: "education",
      text: `Educational Deep Dive: Why Proof-of-Work is still the gold standard for decentralized security compared to Proof-of-Stake.`,
    },
    {
      id: "cat_education_6",
      category: "education",
      text: `ELI5: How does Kaspa handle orphan blocks? Spoiler: It doesn't orphan them, it merges them.`,
    },
    {
      id: "cat_education_7",
      category: "education",
      text: `The difference between a DAG and a Blockchain is that a DAG allows multiple parents per block.`,
    },
    {
      id: "cat_education_8",
      category: "education",
      text: `Why does Kaspa need to be fast? To withstand network latency and allow for global decentralization.`,
    },
    {
      id: "cat_education_9",
      category: "education",
      text: `Guide: How to read the Kaspa explorer. What do the different colors of blocks mean?`,
    },
    {
      id: "cat_education_10",
      category: "education",
      text: `Understanding the halving schedule. Kaspa reduces emission smoothly every month, not abruptly every 4 years.`,
    },

    //
    // MINING
    // Focus: Hashrate, ASICs, pools, electricity, profitability, difficulty.
    //
    {
      id: "cat_mining_1",
      category: "mining",
      text: `Network hashrate just crossed 200 PH/s. The difficulty adjustment is going to be brutal next epoch.`,
    },
    {
      id: "cat_mining_2",
      category: "mining",
      text: `Reviewing the new IceRiver ASIC. The efficiency is 0.5 Joules per Gigahash, which is profitable at $0.05 electric.`,
    },
    {
      id: "cat_mining_3",
      category: "mining",
      text: `Which mining pool has the best payout scheme? PPS+ or PPLNS? Looking for low orphan rates.`,
    },
    {
      id: "cat_mining_4",
      category: "mining",
      text: `My mining rig is overheating. Need to improve the airflow in the data center before summer hits.`,
    },
    {
      id: "cat_mining_5",
      category: "mining",
      text: `Solo mining Kaspa is getting harder. You need massive hashrate to find a block now. Switching to pool mining.`,
    },
    {
      id: "cat_mining_6",
      category: "mining",
      text: `The block reward is dropping next month. Miners need to upgrade firmware to stay efficient.`,
    },
    {
      id: "cat_mining_7",
      category: "mining",
      text: `Just plugged in my KS3 miner. The noise level is insane but the hashrate is stable.`,
    },
    {
      id: "cat_mining_8",
      category: "mining",
      text: `Comparing the profitability of mining KAS vs mining ETC. Kaspa wins on efficiency.`,
    },
    {
      id: "cat_mining_9",
      category: "mining",
      text: `The mining difficulty chart is parabolic. Secure network, but hard for small miners.`,
    },
    {
      id: "cat_mining_10",
      category: "mining",
      text: `Are there any FPGA bitstreams available for the new kHeavyHash algorithm update?`,
    },

    //
    // PRICE TALK
    // Focus: Chart patterns, targets, TA, FOMO, accumulation, market cap.
    //
    {
      id: "cat_price_1",
      category: "price_talk",
      text: `KAS is testing key resistance at 15 cents. If we break this level with volume, we go to price discovery mode.`,
    },
    {
      id: "cat_price_2",
      category: "price_talk",
      text: `The 4-hour RSI is oversold. Looking for a bounce off the 200-day moving average. Good entry for a long scalp.`,
    },
    {
      id: "cat_price_3",
      category: "price_talk",
      text: `Market cap analysis: If Kaspa flips Litecoin, the price per coin would be $3.50. Long term bag holding target.`,
    },
    {
      id: "cat_price_4",
      category: "price_talk",
      text: `Panic sellers are getting wrecked. The wick on that daily candle shows massive buy pressure at the bottom.`,
    },
    {
      id: "cat_price_5",
      category: "price_talk",
      text: `Accumulating in this range. The chart looks like a classic Wyckoff accumulation pattern before the markup phase.`,
    },
    {
      id: "cat_price_6",
      category: "price_talk",
      text: `Bearish divergence on the weekly. We might retrace to the 0.618 Fibonacci level before the next leg up.`,
    },
    {
      id: "cat_price_7",
      category: "price_talk",
      text: `Liquidity is thin on the order book. A small market buy just moved the price 2%.`,
    },
    {
      id: "cat_price_8",
      category: "price_talk",
      text: `My prediction: KAS hits $1.00 by EOY based on the power law channel adoption curve.`,
    },
    {
      id: "cat_price_9",
      category: "price_talk",
      text: `Support at $0.10 held strong. The bulls are defending this level aggressively.`,
    },
    {
      id: "cat_price_10",
      category: "price_talk",
      text: `Golden cross incoming! The 50MA is about to cross the 200MA. Historically a very bullish signal.`,
    },

    //
    // EXCHANGE
    // Focus: Listings, deposits, withdrawals, CEX, tiers, KYC, trading pairs.
    //
    {
      id: "cat_exchange_1",
      category: "exchange",
      text: `Binance listing rumors are flying again. If a Tier 1 exchange lists KAS, the liquidity will skyrocket.`,
    },
    {
      id: "cat_exchange_2",
      category: "exchange",
      text: `Withdrawals are suspended on KuCoin for wallet maintenance. Deposits are still working fine.`,
    },
    {
      id: "cat_exchange_3",
      category: "exchange",
      text: `Bybit just opened perpetual futures for KAS/USDT. Now we have leverage trading markets available.`,
    },
    {
      id: "cat_exchange_4",
      category: "exchange",
      text: `Can't withdraw my coins from the exchange. Not your keys, not your coins. Move to self-custody immediately.`,
    },
    {
      id: "cat_exchange_5",
      category: "exchange",
      text: `The spread on this exchange is too high. Arbitrage bots are closing the gap between Gate.io and MEXC prices.`,
    },
    {
      id: "cat_exchange_6",
      category: "exchange",
      text: `When is Coinbase going to list Kaspa? The Rosetta implementation is already done.`,
    },
    {
      id: "cat_exchange_7",
      category: "exchange",
      text: `KYC is required for this exchange now. Moving my trading volume to a non-KYC platform.`,
    },
    {
      id: "cat_exchange_8",
      category: "exchange",
      text: `Just deposited KAS to Mexc, it arrived in 1 minute. The exchange requires 60 confirmations.`,
    },
    {
      id: "cat_exchange_9",
      category: "exchange",
      text: `Trading pairs: We need more KAS/BTC pairs, currently most volume is in USDT.`,
    },
    {
      id: "cat_exchange_10",
      category: "exchange",
      text: `Exchange wallet labeled 'Hot Wallet 3' just moved 10M KAS. Internal transfer or user withdrawals?`,
    },
  ];

export async function seedCategories() {
  const points: {
    id: number;
    vector: number[];
    payload: Record<string, string>;
  }[] = [];

  await Promise.all(
    categoryDescriptions.map(async (cat, index) => {
      const vector = await embed(cat.text);

      points.push({
        id: index + 1,
        vector,
        payload: {
          kind: "category",
          category: cat.category,
          seed_id: cat.id,
          seed_text: cat.text,
        },
      });
    }),
  );

  await qdrant.upsert(TWEET_COLLECTION, {
    wait: true,
    points,
  });
}

export const syncCategories = async () => {
  const existing: any[] = [];
  let offset: number | string | (Record<string, unknown> | null) = null;

  do {
    const { points, next_page_offset } = await qdrant.scroll(TWEET_COLLECTION, {
      limit: 256,
      with_payload: true,
      with_vector: false,
      offset,
      filter: {
        must: [
          {
            key: "kind",
            match: { value: "category" },
          },
        ],
      },
    });

    existing.push(...points);
    offset = next_page_offset ?? null;
  } while (offset != null);

  const expected = categoryDescriptions;

  let mismatch = false;

  if (existing.length !== expected.length) {
    mismatch = true;
  }

  const existingBySeedId = new Map<string, any>();
  for (const p of existing) {
    const seedId = p.payload?.seed_id;
    if (typeof seedId === "string") {
      existingBySeedId.set(seedId, p);
    }
  }

  for (const item of expected) {
    const p = existingBySeedId.get(item.id);
    if (!p) {
      mismatch = true;
      break;
    }

    const payload = p.payload || {};

    if (
      payload.kind !== "category" ||
      payload.category !== item.category ||
      payload.seed_id !== item.id ||
      payload.seed_text !== item.text
    ) {
      mismatch = true;
      break;
    }
  }

  if (mismatch) {
    console.log("Category mismatch detected, re-seeding...");
    await qdrant.delete(TWEET_COLLECTION, {
      wait: true,
      filter: {
        must: [
          {
            key: "kind",
            match: { value: "category" },
          },
        ],
      },
    });

    await seedCategories();
    console.log("Categories re-seeded successfully.");
  } else {
    console.log("Categories are up to date.");
  }
};

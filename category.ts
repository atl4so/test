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
    // HIGH-VALUE: Actual papers, proofs, academic analysis, mathematical formulations
    // NOT: "doing research", "read the whitepaper", vague mentions
    //
    {
      id: "cat_research_1",
      category: "research",
      text: `Analyzing the probabilistic finality in the GhostDAG paper. The formal proof for liveness under 51% attacks uses a Markov chain model with absorbing states.`,
    },
    {
      id: "cat_research_2",
      category: "research",
      text: `The distinction between PHANTOM and GHOSTDAG topological ordering is critical. PHANTOM uses max-k-cluster for anticone bounds, GHOSTDAG uses greedy selection.`,
    },
    {
      id: "cat_research_3",
      category: "research",
      text: `New paper: Modeling block propagation latency against the k-parameter. Theorem 3.2 proves we can push to 100BPS while maintaining 2^-30 reversal probability.`,
    },
    {
      id: "cat_research_4",
      category: "research",
      text: `The convergence mechanism in the DAGKnight paper relies on heavy partial order theory. Lemma 4.1 establishes the bounded anticone property under delay assumptions.`,
    },
    {
      id: "cat_research_5",
      category: "research",
      text: `Kaspa's pruning proof is elegant: Theorem 2 shows that any block older than the finality window can be safely removed without affecting consensus correctness.`,
    },
    {
      id: "cat_research_6",
      category: "research",
      text: `Security analysis: The delay-diameter bound D < k/(1-2δ) ensures honest blocks form a connected subDAG. This is proven in Section 5 of the GhostDAG paper.`,
    },
    {
      id: "cat_research_7",
      category: "research",
      text: `The anticipatory mining paper formalizes selfish mining in DAGs. Unlike Bitcoin, the DAG structure reduces attacker advantage from 25% to under 5% hashrate threshold.`,
    },
    {
      id: "cat_research_8",
      category: "research",
      text: `Formal comparison: Nakamoto selects longest chain O(n), GHOSTDAG selects heaviest sub-DAG O(k*n) but achieves k-times higher throughput with same security margin.`,
    },
    {
      id: "cat_research_9",
      category: "research",
      text: `The orthogonality theorem in Section 3: Data availability and ordering can be decoupled in DAG protocols, enabling independent scaling of each dimension.`,
    },
    {
      id: "cat_research_10",
      category: "research",
      text: `Reachability in the DAG uses blue score intervals. Proposition 2.4 proves O(log n) query complexity using the chain decomposition structure.`,
    },
    {
      id: "cat_research_11",
      category: "research",
      text: `Published: Our analysis of the GHOSTDAG k-cluster algorithm shows optimal k = 18 for current network conditions, balancing throughput against orphan rate.`,
    },
    {
      id: "cat_research_12",
      category: "research",
      text: `The liveness proof in DAGKnight is non-trivial. It requires showing that the virtual selected parent chain grows monotonically despite network asynchrony.`,
    },

    //
    // DEVELOPMENT
    // HIGH-VALUE: Actual code commits, PRs, bug fixes, technical implementation details
    // NOT: "devs are working", "when update", "team is building"
    //
    {
      id: "cat_development_1",
      category: "development",
      text: `PR #1847 merged: Fixed race condition in kaspad mempool handler. The Mutex guard was being dropped before the channel send completed.`,
    },
    {
      id: "cat_development_2",
      category: "development",
      text: `Commit pushed: Increased gRPC frame size from 4MB to 16MB in grpc-server/src/config.rs. Large UTXO queries were failing silently.`,
    },
    {
      id: "cat_development_3",
      category: "development",
      text: `Released kaspa-wasm v0.14.0: Added signTransaction() and broadcastTransaction() methods. npm install kaspa-wasm to try it.`,
    },
    {
      id: "cat_development_4",
      category: "development",
      text: `Build time reduced 40%: Enabled parallel compilation for consensus module using cargo's --jobs flag. CI pipeline now takes 8 minutes instead of 14.`,
    },
    {
      id: "cat_development_5",
      category: "development",
      text: `Implemented Borsh serialization for RPC: GetBlockTemplate response dropped from 2.3KB JSON to 890 bytes binary. Significant bandwidth savings for miners.`,
    },
    {
      id: "cat_development_6",
      category: "development",
      text: `Bug fix deployed: P2P handshake was failing when UserAgent contained special characters. Fixed in network/src/handshake.rs line 142.`,
    },
    {
      id: "cat_development_7",
      category: "development",
      text: `New feature in rusty-kaspa: Added --utxoindex flag to enable UTXO indexing on startup. Required for wallets that need address balance queries.`,
    },
    {
      id: "cat_development_8",
      category: "development",
      text: `Unit test fix: DAA window calculation was off by one in edge case where timestamp == 0. Added regression test in consensus/tests/daa_test.rs.`,
    },
    {
      id: "cat_development_9",
      category: "development",
      text: `kaspa-cli v0.12.0 released: New commands added - getblockdag, getmempoolentry, submitblock. Full changelog on GitHub releases page.`,
    },
    {
      id: "cat_development_10",
      category: "development",
      text: `API breaking change: SubmitTransaction now returns {txid, status} instead of just txid. Update your integrations before v0.15.`,
    },
    {
      id: "cat_development_11",
      category: "development",
      text: `Debugging tip: If kaspad crashes with "index out of bounds" on startup, delete the datadir/consensus folder. Known issue being fixed in next release.`,
    },
    {
      id: "cat_development_12",
      category: "development",
      text: `Code review needed: PR #1923 adds batch transaction submission. Looking for reviewers familiar with the mempool module.`,
    },

    //
    // VPROG
    // HIGH-VALUE: Actual technical vProg implementation, ZK circuit details, code examples
    // NOT: "vProgs are coming", "smart contracts soon", vague ZK mentions
    //
    {
      id: "cat_vprog_1",
      category: "vprog",
      text: `Deployed my first vProg to testnet: A simple escrow contract. The ZK circuit compilation took 3 hours but proof generation is only 200ms.`,
    },
    {
      id: "cat_vprog_2",
      category: "vprog",
      text: `vProg architecture deep dive: The state tree uses Poseidon hashing for ZK-friendliness. Merkle proofs verify state transitions in O(log n).`,
    },
    {
      id: "cat_vprog_3",
      category: "vprog",
      text: `ScopeGas implementation details: Each opcode has a gas cost table. VERIFY_PROOF costs 50k gas, STATE_UPDATE costs 10k. Prevents DoS on validators.`,
    },
    {
      id: "cat_vprog_4",
      category: "vprog",
      text: `Built a token swap vProg: Users submit orders off-chain, sequencer batches them, posts ZK proof of valid matching to Kaspa. 1000 swaps per proof.`,
    },
    {
      id: "cat_vprog_5",
      category: "vprog",
      text: `vProg SDK tutorial: Initialize with vprog_init(), define state schema, write transition functions, compile with vprog_compile(). Full docs at docs.kaspa.org/vprogs`,
    },
    {
      id: "cat_vprog_6",
      category: "vprog",
      text: `Testing Groth16 vs PLONK for vProg proofs: Groth16 has smaller proofs (192 bytes) but requires trusted setup. PLONK is 2.5KB but trustless.`,
    },
    {
      id: "cat_vprog_7",
      category: "vprog",
      text: `vProg sequencer design: Collects user transactions, executes off-chain, generates validity proof, anchors to Kaspa block. Challenge period is 100 blocks.`,
    },
    {
      id: "cat_vprog_8",
      category: "vprog",
      text: `Writing vProg circuits in Circom: constraint count for an ERC20 transfer is ~5000. Proof time on M1 Mac is 800ms. Verification on-chain is instant.`,
    },
    {
      id: "cat_vprog_9",
      category: "vprog",
      text: `Recursive SNARK implementation for vProgs: Each proof verifies the previous proof plus new transactions. Amortizes verification cost across millions of txs.`,
    },
    {
      id: "cat_vprog_10",
      category: "vprog",
      text: `vProg state model: Global state root stored on-chain, full state stored by sequencers. Users can exit by proving their balance in the state tree.`,
    },
    {
      id: "cat_vprog_11",
      category: "vprog",
      text: `Debugging vProg circuits: Use snarkjs wtns debug to inspect intermediate signals. Common bug is field overflow when multiplying large numbers.`,
    },
    {
      id: "cat_vprog_12",
      category: "vprog",
      text: `vProg gas economics: Proof verification costs 0.01 KAS regardless of computation size. This makes complex DeFi operations economically viable.`,
    },

    //
    // DAGKNIGHT
    // HIGH-VALUE: Actual consensus mechanics, parameter analysis, technical comparisons
    // NOT: "DAGKnight soon", "can't wait for DAGKnight", hype without substance
    //
    {
      id: "cat_dagknight_1",
      category: "dagknight",
      text: `DAGKnight removes the fixed k parameter. Instead it calculates k dynamically: k = ceil(2 * D_observed / block_time) where D_observed is measured network delay.`,
    },
    {
      id: "cat_dagknight_2",
      category: "dagknight",
      text: `DAGKnight testnet results: Confirmation time dropped from 10s to 1.2s average. The adaptive algorithm detected network RTT of 180ms and adjusted accordingly.`,
    },
    {
      id: "cat_dagknight_3",
      category: "dagknight",
      text: `Technical comparison: GhostDAG needs k=18 hardcoded for safety at 1BPS. DAGKnight achieves same security at 10BPS by measuring actual network conditions.`,
    },
    {
      id: "cat_dagknight_4",
      category: "dagknight",
      text: `DAGKnight ordering algorithm: For each block, compute reachability intervals using blue score. Blocks with non-overlapping intervals can be ordered definitively.`,
    },
    {
      id: "cat_dagknight_5",
      category: "dagknight",
      text: `The responsiveness property in DAGKnight: If network delay is D, confirmation happens in O(D) time, not O(k * block_time) like GhostDAG.`,
    },
    {
      id: "cat_dagknight_6",
      category: "dagknight",
      text: `DAGKnight implementation detail: The virtual k is recalculated every 1000 blocks using a sliding window of observed block arrival times.`,
    },
    {
      id: "cat_dagknight_7",
      category: "dagknight",
      text: `Simulation results: DAGKnight maintained correct ordering under 40% packet loss. GhostDAG with fixed k failed at 25% loss due to k being too small.`,
    },
    {
      id: "cat_dagknight_8",
      category: "dagknight",
      text: `DAGKnight rust implementation progress: Core ordering algorithm complete in consensus/src/dagknight/ordering.rs. Block selection logic next.`,
    },
    {
      id: "cat_dagknight_9",
      category: "dagknight",
      text: `Why DAGKnight scales better: As internet improves (lower latency), k automatically decreases, confirmation times drop proportionally. No hard forks needed.`,
    },
    {
      id: "cat_dagknight_10",
      category: "dagknight",
      text: `DAGKnight finality formula: Finality at depth d requires d > k_virtual + security_margin. With measured k=5, finality is ~6 blocks vs GhostDAG's 20+ blocks.`,
    },
    {
      id: "cat_dagknight_11",
      category: "dagknight",
      text: `The "Knight" in DAGKnight: Like chess knight's L-shaped moves, the algorithm can jump across the DAG structure to find optimal ordering paths.`,
    },
    {
      id: "cat_dagknight_12",
      category: "dagknight",
      text: `DAGKnight security analysis: Theorem 4.2 proves that confirmation time is optimal up to constant factor for any PoW DAG protocol under network delay D.`,
    },

    //
    // NODE
    // HIGH-VALUE: Actual node operations, configs, troubleshooting with solutions, metrics
    // NOT: "should I run a node?", "how do I run a node?", vague questions
    //
    {
      id: "cat_node_1",
      category: "node",
      text: `Node config optimized: Set --utxoindex=true --rpclisten=0.0.0.0:16110 --maxinpeers=128. Disk usage 45GB pruned, RAM 8GB, sync time 1.5 hours.`,
    },
    {
      id: "cat_node_2",
      category: "node",
      text: `Public node setup guide: kaspad with Nginx reverse proxy, SSL cert from Let's Encrypt, rate limiting at 100req/s. Config files in my GitHub gist.`,
    },
    {
      id: "cat_node_3",
      category: "node",
      text: `IBD benchmark: Fresh sync completed in 1h47m on Hetzner AX41. NVMe sustained 500MB/s writes during header download phase. Final DB size 38GB.`,
    },
    {
      id: "cat_node_4",
      category: "node",
      text: `Archive node requirements: 500GB+ NVMe (not HDD), 32GB RAM for full UTXO index, 1Gbps for peak sync. Running on Contabo VPS, €25/month.`,
    },
    {
      id: "cat_node_5",
      category: "node",
      text: `Port forwarding 16111 fixed my peer count. Went from 8 peers to 64. Use upnpc -a 192.168.1.x 16111 16111 TCP if router supports UPnP.`,
    },
    {
      id: "cat_node_6",
      category: "node",
      text: `RAM optimization: Added --max-tracked-addresses=100000 to kaspad. Dropped memory from 14GB to 6GB. Essential for VPS with limited RAM.`,
    },
    {
      id: "cat_node_7",
      category: "node",
      text: `Orphan block diagnosis: Checked logs, found 200ms+ latency to peers. Switched to a server in Frankfurt, orphan rate dropped from 5% to 0.3%.`,
    },
    {
      id: "cat_node_8",
      category: "node",
      text: `gRPC UTXO query fix: The getUtxosByAddresses endpoint needs --utxoindex enabled at startup. Restart with flag, wait for reindex (~30 min).`,
    },
    {
      id: "cat_node_9",
      category: "node",
      text: `Docker deployment: docker run -d -p 16110:16110 -p 16111:16111 -v kaspa-data:/app/data kaspa/kaspad:latest. Compose file handles auto-restart.`,
    },
    {
      id: "cat_node_10",
      category: "node",
      text: `Monitoring setup: Prometheus scraping kaspad metrics endpoint, Grafana dashboard showing DAG tips, mempool size, peer latencies. Dashboard JSON shared.`,
    },
    {
      id: "cat_node_11",
      category: "node",
      text: `Node upgrade process: Stop kaspad, backup datadir, download new binary, start with same flags. No reindex needed for minor version bumps.`,
    },
    {
      id: "cat_node_12",
      category: "node",
      text: `Troubleshooting: "Database corrupted" error after crash. Fixed by deleting datadir/consensus/staging folder. Node resynced from pruning point.`,
    },

    //
    // KIP PROPOSALS
    // HIGH-VALUE: Actual KIP content, specific proposals, governance decisions with details
    // NOT: "we need governance", "someone should propose", vague mentions
    //
    {
      id: "cat_kip_1",
      category: "kip_proposals",
      text: `KIP-13 Analysis: Proposes changing DAA window from 2641 to 4000 blocks. Pros: smoother difficulty, Cons: slower response to hashrate drops. My vote: FOR.`,
    },
    {
      id: "cat_kip_2",
      category: "kip_proposals",
      text: `New KIP draft: Standardize address format to include network prefix (kaspa: vs kaspatest:). Currently on GitHub for review, PR #47.`,
    },
    {
      id: "cat_kip_3",
      category: "kip_proposals",
      text: `KIP-9 passed: Minimum transaction fee increased from 1 sompi to 10 sompi per byte. Effective at block height 45,000,000. Dust attack mitigation.`,
    },
    {
      id: "cat_kip_4",
      category: "kip_proposals",
      text: `Proposing KIP-15: Standard URI scheme kaspa:address?amount=X&label=Y&message=Z. Compatible with BIP-21. Draft at github.com/kaspa/kips/15.`,
    },
    {
      id: "cat_kip_5",
      category: "kip_proposals",
      text: `KIP-10 voting results: 73% FOR, 21% AGAINST, 6% ABSTAIN. The block size increase from 500KB to 1MB is approved. Implementation ETA: Q2.`,
    },
    {
      id: "cat_kip_6",
      category: "kip_proposals",
      text: `KIP-11 technical spec: New RPC method getBlockTemplate() must return DAA score and blue work. Required for updated mining software compatibility.`,
    },
    {
      id: "cat_kip_7",
      category: "kip_proposals",
      text: `Debating KIP-14: Should transaction fees burn or go to miners? Current split is 50/50. Economic analysis document posted on forum.`,
    },
    {
      id: "cat_kip_8",
      category: "kip_proposals",
      text: `KIP process reminder: 1) Draft on GitHub 2) Forum discussion 3) Technical review 4) Signaling vote 5) Implementation. KIP-12 at stage 3.`,
    },
    {
      id: "cat_kip_9",
      category: "kip_proposals",
      text: `KIP-16 submitted: Standardize OP_RETURN data format for metadata. Max 80 bytes, first 4 bytes = protocol identifier. Comments welcome.`,
    },
    {
      id: "cat_kip_10",
      category: "kip_proposals",
      text: `Technical committee approved KIP-11 implementation. Michael Sutton signed off on consensus compatibility. Merge to master scheduled Friday.`,
    },
    {
      id: "cat_kip_11",
      category: "kip_proposals",
      text: `KIP-17 proposal: Add checksum to addresses (like Bitcoin's bech32). Reduces typo errors from 1-in-4B to 1-in-1T. Discussion thread active.`,
    },
    {
      id: "cat_kip_12",
      category: "kip_proposals",
      text: `Rejected: KIP-8 (reduce emission by 50%) failed with 89% against. Community consensus: fair launch emission schedule should not change.`,
    },

    //
    // L2 BUILDERS
    // HIGH-VALUE: Actual project launches, technical details, working products, integration guides
    // NOT: "building something soon", "L2s are coming", vague announcements
    //
    {
      id: "cat_l2_builders_1",
      category: "l2_builders",
      text: `KaspaPay v2.0 released: Payment gateway with 1-second finality. API docs at docs.kaspay.io. Integration takes 10 lines of code. 500 merchants onboarded.`,
    },
    {
      id: "cat_l2_builders_2",
      category: "l2_builders",
      text: `Our rollup architecture: Sequencer batches 1000 txs, posts data to Kaspa blocks, generates fraud proof. EVM compatible, 0.001 KAS per tx. Testnet live.`,
    },
    {
      id: "cat_l2_builders_3",
      category: "l2_builders",
      text: `KRC-20 deployment guide: Call inscribe() with token metadata, pay 1 KAS fee, receive token ID. First 10k KRC-20s already minted. Kasplex indexer tracks all.`,
    },
    {
      id: "cat_l2_builders_4",
      category: "l2_builders",
      text: `Bridge audit complete: Certik verified our ETH-KAS bridge. Multisig custody with 5-of-8 threshold. wKAS on Ethereum launched at 0x7a3...f2c.`,
    },
    {
      id: "cat_l2_builders_5",
      category: "l2_builders",
      text: `DEX beta launch: Order book matching off-chain, settlement on Kaspa. 0.1% fees, instant fills. Trading KAS/USDT and KRC-20 pairs. Try it at kaspadex.io`,
    },
    {
      id: "cat_l2_builders_6",
      category: "l2_builders",
      text: `Shopify plugin released: Accept KAS payments with one-click install. Auto-conversion to fiat via partner exchange. 200 stores using it already.`,
    },
    {
      id: "cat_l2_builders_7",
      category: "l2_builders",
      text: `kUSD stablecoin design: 150% KAS collateral ratio, liquidations at 120%, oracle from 5 price feeds. Smart contract on testnet, auditing next month.`,
    },
    {
      id: "cat_l2_builders_8",
      category: "l2_builders",
      text: `Kasplex indexer API: GET /tokens/{id}/holders returns all balances. Websocket for real-time transfers. Free tier: 10k requests/day. api.kasplex.org`,
    },
    {
      id: "cat_l2_builders_9",
      category: "l2_builders",
      text: `Payment channel implementation: Open channel with 2-of-2 multisig, exchange signed updates off-chain, close with final state. Sub-second micropayments.`,
    },
    {
      id: "cat_l2_builders_10",
      category: "l2_builders",
      text: `KaspaQuest game launched: Earn KRC-20 tokens by completing quests. 5k daily active users. NFT rewards stored on-chain. Play at kaspaquest.game`,
    },
    {
      id: "cat_l2_builders_11",
      category: "l2_builders",
      text: `NFT marketplace live: Mint, list, buy KRC-721 NFTs. Royalties enforced on-chain. 10k NFTs traded in first week. Volume: 50k KAS. nft.kaspa.market`,
    },
    {
      id: "cat_l2_builders_12",
      category: "l2_builders",
      text: `Building invoice system on Kaspa: Generate payment request, QR code with amount, webhook on confirmation. API for accounting software integration.`,
    },

    //
    // ECOSYSTEM
    // HIGH-VALUE: Confirmed partnerships, actual adoption metrics, grant announcements with details
    // NOT: "partnership soon", "adoption coming", rumors without confirmation
    //
    {
      id: "cat_ecosystem_1",
      category: "ecosystem",
      text: `Official: Tangem wallet v3.2 adds native Kaspa support. NFC hardware wallet, $50 price point, available in 40 countries. Order at tangem.com/kaspa`,
    },
    {
      id: "cat_ecosystem_2",
      category: "ecosystem",
      text: `Adoption metrics Q4: 15,000 active merchants accepting KAS via payment processors. Transaction volume up 340% YoY. Top regions: Turkey, Brazil, Nigeria.`,
    },
    {
      id: "cat_ecosystem_3",
      category: "ecosystem",
      text: `Ecosystem map updated: 67 projects tracked - 12 wallets, 8 explorers, 15 DeFi, 22 infrastructure, 10 games. Full list at ecosystem.kaspa.org`,
    },
    {
      id: "cat_ecosystem_4",
      category: "ecosystem",
      text: `Consensus 2024 recap: Met with 3 exchanges, 2 custody providers, 5 payment companies. Signed LOI with major remittance service. Details Q1.`,
    },
    {
      id: "cat_ecosystem_5",
      category: "ecosystem",
      text: `BitPay integration confirmed: 250,000 merchants can now accept Kaspa. Settlement in KAS or auto-convert to USD. Live in 30 days.`,
    },
    {
      id: "cat_ecosystem_6",
      category: "ecosystem",
      text: `Ambassador Program launched: 50 regional leads across 30 countries. Monthly budget $5k per region for meetups and education. Apply at kaspa.org/ambassador`,
    },
    {
      id: "cat_ecosystem_7",
      category: "ecosystem",
      text: `First Kaspa ATM installed in Miami. Operated by CoinFlip, supports buy/sell, 3% fee. Location: 123 Ocean Drive. 10 more locations planned Q1.`,
    },
    {
      id: "cat_ecosystem_8",
      category: "ecosystem",
      text: `Travala partnership live: Book 3M+ hotels and flights with KAS. 5% discount for Kaspa payments. First travel booking platform to integrate.`,
    },
    {
      id: "cat_ecosystem_9",
      category: "ecosystem",
      text: `Grant approved: $150k to Kaspa Academy for educational content. Deliverables: 20 video tutorials, documentation in 10 languages, certification program.`,
    },
    {
      id: "cat_ecosystem_10",
      category: "ecosystem",
      text: `Gaming partnership: Unity SDK for Kaspa payments released. 3 AAA studios evaluating integration. In-game purchases with instant KAS settlement.`,
    },
    {
      id: "cat_ecosystem_11",
      category: "ecosystem",
      text: `University adoption: MIT blockchain club added Kaspa to curriculum. Stanford following in Spring. Academic interest in GHOSTDAG growing.`,
    },
    {
      id: "cat_ecosystem_12",
      category: "ecosystem",
      text: `Ecosystem fund update: $2M deployed to 15 projects in 2024. Focus areas: infrastructure (40%), DeFi (30%), tools (20%), education (10%).`,
    },

    //
    // TOOLS
    // HIGH-VALUE: Actual tool releases with features, working links, how-to use
    // NOT: "need a tool for X", "is there a tool?", vague requests
    //
    {
      id: "cat_tools_1",
      category: "tools",
      text: `Explorer v2.0 released: 3D DAG visualization, blue score highlighting, mempool view, address clustering. Live at explorer.kaspa.org. Open source on GitHub.`,
    },
    {
      id: "cat_tools_2",
      category: "tools",
      text: `Fee calculator tool: Input your tx size, get optimal fee based on last 100 blocks. Also shows mempool congestion. kaspa-tools.com/fee-calc`,
    },
    {
      id: "cat_tools_3",
      category: "tools",
      text: `Kaspa-Graph-Inspector update: Now shows orphan blocks in red, selected parent chain in blue. Export DAG snapshots to PNG. github.com/kaspa/kgi`,
    },
    {
      id: "cat_tools_4",
      category: "tools",
      text: `Testnet faucet upgraded: Request 10,000 tKAS per day. Rate limited by IP. No captcha. faucet.testnet.kaspa.org - Devs can test without mainnet costs.`,
    },
    {
      id: "cat_tools_5",
      category: "tools",
      text: `TX decoder tool: Paste raw hex, see inputs/outputs/scripts parsed. Supports P2PKH and P2SH. Validates signatures. decode.kaspa.tools`,
    },
    {
      id: "cat_tools_6",
      category: "tools",
      text: `Kaspium wallet v1.5: Added QR scanner, address book, fee presets (slow/medium/fast). iOS and Android. 50k downloads. kaspium.io`,
    },
    {
      id: "cat_tools_7",
      category: "tools",
      text: `Mining calculator updated: Enter hashrate + power cost, see daily/monthly profit. Includes difficulty projection. kaspa-calc.com - Data refreshes hourly.`,
    },
    {
      id: "cat_tools_8",
      category: "tools",
      text: `Tax export tool released: Connect wallet address, export all transactions as CSV with cost basis. Supports Koinly, CoinTracker formats. kaspax.tax`,
    },
    {
      id: "cat_tools_9",
      category: "tools",
      text: `Real-time DAG visualizer: Watch blocks appear as nodes, transactions as edges. Color-coded by miner. Hypnotic and educational. dag.kaspa.live`,
    },
    {
      id: "cat_tools_10",
      category: "tools",
      text: `Whale alert bot launched: Telegram @KaspaWhaleAlert - Notifications for txs > 1M KAS. Also tracks exchange hot wallets. 5k subscribers.`,
    },
    {
      id: "cat_tools_11",
      category: "tools",
      text: `Address generator CLI: kaspa-keygen --network mainnet --count 100. Outputs addresses + private keys. Supports BIP39 mnemonics. npm install kaspa-keygen`,
    },
    {
      id: "cat_tools_12",
      category: "tools",
      text: `Block notification service: Webhook when new block includes your address. REST API at notify.kaspa.tools. Free tier: 10 addresses.`,
    },

    //
    // COMMUNITY_CULTURE
    // CATCH-ALL: Memes, hype, questions, vague mentions, low-value content, "wen X", DYOR
    // This is where tweets with NO educational/informational value go
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
      text: `GM Kaspa fam! Let's mine some blocks and disrupt the financial system today.`,
    },
    {
      id: "cat_community_culture_7",
      category: "community_culture",
      text: `You don't choose Kaspa, Kaspa chooses you. LFG! `,
    },
    {
      id: "cat_community_culture_8",
      category: "community_culture",
      text: `Wen Binance? Stop asking. We build, they come to us.`,
    },
    {
      id: "cat_community_culture_9",
      category: "community_culture",
      text: `I sold my car to buy more KAS. Not financial advice, I just really like the DAG.`,
    },
    {
      id: "cat_community_culture_10",
      category: "community_culture",
      text: `Serious question for the Kaspa community: How does Kaspa compare to ZCash? Is it better for privacy?`,
    },
    {
      id: "cat_community_culture_11",
      category: "community_culture",
      text: `Can someone explain vProgs to me? I keep hearing about it but I don't get it. Help?`,
    },
    {
      id: "cat_community_culture_12",
      category: "community_culture",
      text: `Study vProgs. This is the future. Trust me bro. DYOR.`,
    },
    {
      id: "cat_community_culture_13",
      category: "community_culture",
      text: `Why is nobody talking about this? Kaspa is going to change everything!`,
    },
    {
      id: "cat_community_culture_14",
      category: "community_culture",
      text: `Has anyone looked into the ZK stuff? Seems interesting but I don't understand it.`,
    },
    {
      id: "cat_community_culture_15",
      category: "community_culture",
      text: `What do you guys think about DAGKnight? Is it really that big of a deal?`,
    },
    {
      id: "cat_community_culture_16",
      category: "community_culture",
      text: `Someone smarter than me please explain how this works. I'm confused.`,
    },
    {
      id: "cat_community_culture_17",
      category: "community_culture",
      text: `Check this out! Bullish if true! `,
    },
    {
      id: "cat_community_culture_18",
      category: "community_culture",
      text: `I don't understand the tech but I believe in the team. Let's go Kaspa!`,
    },
    {
      id: "cat_community_culture_19",
      category: "community_culture",
      text: `Quick question: Is Kaspa better than Solana? Thoughts?`,
    },
    {
      id: "cat_community_culture_20",
      category: "community_culture",
      text: `Kaspa will flip Bitcoin by 2030. Mark my words. Screenshot this.`,
    },
    {
      id: "cat_community_culture_21",
      category: "community_culture",
      text: `Still early! Most people don't even know what Kaspa is yet.`,
    },
    {
      id: "cat_community_culture_22",
      category: "community_culture",
      text: `Who else is holding KAS? Reply with your bag size!`,
    },
    {
      id: "cat_community_culture_23",
      category: "community_culture",
      text: `Kaspa is the most undervalued project in crypto. Not financial advice.`,
    },
    {
      id: "cat_community_culture_24",
      category: "community_culture",
      text: `Anyone know when the next update is coming? The devs are quiet lately.`,
    },
    {
      id: "cat_community_culture_25",
      category: "community_culture",
      text: `New to Kaspa, where should I start? Any resources? Thanks in advance!`,
    },
    {
      id: "cat_community_culture_26",
      category: "community_culture",
      text: `Kaspa community is the best in crypto. No toxicity, just vibes. `,
    },
    {
      id: "cat_community_culture_27",
      category: "community_culture",
      text: `Imagine not holding KAS in 2024. Couldn't be me. WAGMI.`,
    },
    {
      id: "cat_community_culture_28",
      category: "community_culture",
      text: `What wallet do you guys use? Looking for recommendations.`,
    },
    {
      id: "cat_community_culture_29",
      category: "community_culture",
      text: `Kaspa fixes this. Every problem in crypto, Kaspa fixes it.`,
    },
    {
      id: "cat_community_culture_30",
      category: "community_culture",
      text: `GN Kaspa fam! See you tomorrow. Keep stacking! `,
    },
    // Hype taglines with hashtags - no actual content
    {
      id: "cat_community_culture_31",
      category: "community_culture",
      text: `BlockDAG City. Built for speed. 🚀 #Kaspa $KAS #BLOCKDAG`,
    },
    {
      id: "cat_community_culture_32",
      category: "community_culture",
      text: `The future is fast. The future is Kaspa. 💎 #KAS #Crypto`,
    },
    {
      id: "cat_community_culture_33",
      category: "community_culture",
      text: `Speed. Security. Scalability. Kaspa has it all. #Kaspa $KAS`,
    },
    {
      id: "cat_community_culture_34",
      category: "community_culture",
      text: `Built different. Built better. Built on Kaspa. 🔥 #KAS`,
    },
    {
      id: "cat_community_culture_35",
      category: "community_culture",
      text: `Kaspa never sleeps. The network that just works. 24/7/365 💪`,
    },
    {
      id: "cat_community_culture_36",
      category: "community_culture",
      text: `One block per second. Infinite possibilities. $KAS #Kaspa`,
    },
    {
      id: "cat_community_culture_37",
      category: "community_culture",
      text: `The silent revolution. No hype needed when tech speaks. #Kaspa`,
    },
    {
      id: "cat_community_culture_38",
      category: "community_culture",
      text: `Kaspa: Where speed meets decentralization. LFG! 🚀 $KAS`,
    },
    // NFT promotions and mints
    {
      id: "cat_community_culture_39",
      category: "community_culture",
      text: `Mint the last MECHANGELS here! kaspa.com/nft/collection. Only 20% left before sold out! 🔥`,
    },
    {
      id: "cat_community_culture_40",
      category: "community_culture",
      text: `KASBOTS V2 is 80% MINTED OUT! 🤖 Only 20% left. Get yours before they're gone!`,
    },
    {
      id: "cat_community_culture_41",
      category: "community_culture",
      text: `New NFT collection dropping on Kaspa! First 100 minters get rare traits. Link in bio.`,
    },
    // Token fair-launches and promos
    {
      id: "cat_community_culture_42",
      category: "community_culture",
      text: `@LTA_17 First token fair-launched on Kaspa. @NachotheKat is the derivative. Get in early!`,
    },
    {
      id: "cat_community_culture_43",
      category: "community_culture",
      text: `Gold Black Friday! Stake $Gold (unique KRC-20 coin on Kaspa) and earn $Whales. Rewards payed over 1 year!`,
    },
    {
      id: "cat_community_culture_44",
      category: "community_culture",
      text: `New KRC-20 token just launched! $MEME on Kaspa. Fair launch, no presale. DYOR!`,
    },
    // Voting spam and giveaways
    {
      id: "cat_community_culture_45",
      category: "community_culture",
      text: `Hello #telfam. Friendly reminder. The next round of the CoinMetro Golden Ticket is live! Let's beat $wco and $kas So vote $tel!`,
    },
    {
      id: "cat_community_culture_46",
      category: "community_culture",
      text: `11,000 $KAS Black Friday Giveaway! How to Play: Like, Share, Follow, Tag 3 friends. Winners announced Monday!`,
    },
    {
      id: "cat_community_culture_47",
      category: "community_culture",
      text: `Vote for Kaspa on this exchange listing poll! Let's get #KAS to the top! Every vote counts! 🗳️`,
    },
    // Support requests and scams
    {
      id: "cat_community_culture_48",
      category: "community_culture",
      text: `Hey @Zun2025 I also forgot my kaspa seed phrase.. I got some stimmies there.. Can you help pleaseeeeeee 🙏`,
    },
    {
      id: "cat_community_culture_49",
      category: "community_culture",
      text: `I lost my wallet seed phrase. Anyone know how to recover? Have 5000 KAS stuck. Please help!`,
    },
    {
      id: "cat_community_culture_50",
      category: "community_culture",
      text: `@Trezor @everstake_pool I cannot keep a #kaspa in #trezor. When will you support it?`,
    },
    // Off-topic Bitcoin comparisons
    {
      id: "cat_community_culture_51",
      category: "community_culture",
      text: `Lightning actually killed Bitcoins fee market when it was launched! Same will happen with other L2s.`,
    },
    {
      id: "cat_community_culture_52",
      category: "community_culture",
      text: `Bitcoin has Lightning, Kaspa has speed natively. That's the difference. No L2 needed.`,
    },
    // Random low-content mentions
    {
      id: "cat_community_culture_53",
      category: "community_culture",
      text: `@hashdag and @michaelsuttonil are artists. True legends of the Kaspa ecosystem.`,
    },
    {
      id: "cat_community_culture_54",
      category: "community_culture",
      text: `@dexcc_official kaspa:qqr7e633kxk86c96w4g27c - here's my address, send some KAS! 💰`,
    },
    {
      id: "cat_community_culture_55",
      category: "community_culture",
      text: `From now on kaspa.news lets you choose to see only posts with images, ranked by views. Press the Images button.`,
    },
    // Whale/price articles disguised as tools
    {
      id: "cat_community_culture_56",
      category: "community_culture",
      text: `Kaspa: Exploded 37% to $0.058 as whale wallet adds 10M KAS in single day. Holdings now exceed 1.2B tokens.`,
    },
    {
      id: "cat_community_culture_57",
      category: "community_culture",
      text: `Is Kaspa's 20% rally sustainable? Whale accumulation says yes. Big wallets adding millions of KAS.`,
    },
    {
      id: "cat_community_culture_58",
      category: "community_culture",
      text: `KAS whale alert! Large wallet just bought 5M KAS. Price impact incoming? Watch closely.`,
    },
    // Questions that aren't educational
    {
      id: "cat_community_culture_59",
      category: "community_culture",
      text: `What is your favorite way to store your #Kaspa? Hardware wallet? Hot wallet? Paper wallet?`,
    },
    {
      id: "cat_community_culture_60",
      category: "community_culture",
      text: `Don't you think the fee paid to miners should be measured differently? What's your opinion?`,
    },
    {
      id: "cat_community_culture_61",
      category: "community_culture",
      text: `When will be the final judgement regarding issue with core? Anyone have updates?`,
    },
    // "Wen" spam
    {
      id: "cat_community_culture_62",
      category: "community_culture",
      text: `@Trezor @everstake_pool Wen Kaspa support? We've been waiting forever! 🙏`,
    },
    {
      id: "cat_community_culture_63",
      category: "community_culture",
      text: `Wen Binance listing? Wen moon? Wen lambo? 🚀`,
    },
    // Just wallet addresses with no content
    {
      id: "cat_community_culture_64",
      category: "community_culture",
      text: `@dexcc_official kaspa:qrphrxg7ungedgcafpm0pj4tfv8eglmu6vrkah6tm3s4y37w36h2xqlpdtq86`,
    },
    // Random feature requests
    {
      id: "cat_community_culture_65",
      category: "community_culture",
      text: `Day 58: requesting @kasplex for public nodes. $kas. Still waiting for a response.`,
    },
    // Support/troubleshooter requests
    {
      id: "cat_community_culture_66",
      category: "community_culture",
      text: `If Kaspa is a top priority for you, feel free to share more details via our troubleshooter at support.trezor.io`,
    },
    // Random comments/sympathies
    {
      id: "cat_community_culture_67",
      category: "community_culture",
      text: `@thekaspaonion I feel sorry for your bother. @RemindMe_OfThis in 6 months. Let's see what happens.`,
    },
    // Wallet complaints
    {
      id: "cat_community_culture_68",
      category: "community_culture",
      text: `Chainge wallet made me lose my $kaspa after they upgraded their wallet without me writing down the phrase. Any hope?`,
    },

    //
    // EDUCATION
    // HIGH-VALUE: Actual explanations with substance, tutorials with steps, comparisons with data
    // NOT: "study this", "learn about X", questions, vague mentions
    //
    {
      id: "cat_education_1",
      category: "education",
      text: `Thread: History of GHOSTDAG. 2013: Sompolinsky proposes GHOST for Bitcoin. 2016: SPECTRE paper. 2018: PHANTOM. 2021: Kaspa mainnet. Each iteration solved specific problems.`,
    },
    {
      id: "cat_education_2",
      category: "education",
      text: `Paper wallet tutorial: 1) Go to wallet.kaspa.org offline 2) Generate keypair 3) Write down 24 words 4) Print QR code 5) Store in fireproof safe. Never enter seed online.`,
    },
    {
      id: "cat_education_3",
      category: "education",
      text: `Block rate vs confirmation time explained: Kaspa produces 1 block/sec but confirmation needs 10 blocks = 10 seconds. High block rate INCREASES security by making attacks expensive.`,
    },
    {
      id: "cat_education_4",
      category: "education",
      text: `UTXO model explained: Your balance = sum of unspent outputs. When you send 5 KAS from a 10 KAS UTXO, you create two outputs: 5 to recipient, 5 back to yourself as change.`,
    },
    {
      id: "cat_education_5",
      category: "education",
      text: `PoW vs PoS security comparison: PoW attack cost = hardware + electricity (external). PoS attack cost = stake (internal, can be recovered). PoW has real-world anchor.`,
    },
    {
      id: "cat_education_6",
      category: "education",
      text: `How Kaspa handles parallel blocks: In Bitcoin, only 1 block wins, others orphaned. In Kaspa DAG, ALL valid blocks are included and ordered by GHOSTDAG algorithm. No wasted work.`,
    },
    {
      id: "cat_education_7",
      category: "education",
      text: `DAG vs Blockchain: Blockchain = linear chain, each block has 1 parent. DAG = directed acyclic graph, blocks can have multiple parents. Enables parallel block creation.`,
    },
    {
      id: "cat_education_8",
      category: "education",
      text: `Why speed matters for decentralization: Slow chains need large blocks = high bandwidth = fewer nodes can participate. Fast blocks + small blocks = more decentralized.`,
    },
    {
      id: "cat_education_9",
      category: "education",
      text: `Explorer color guide: Blue blocks = in selected parent chain. Red = referenced but not selected. Green = your transaction. Yellow = recently added. Size = number of transactions.`,
    },
    {
      id: "cat_education_10",
      category: "education",
      text: `Emission schedule explained: Kaspa halves every year but smoothly - emission drops ~0.19% per month. Total supply caps at ~28.7B KAS. Compare to Bitcoin's abrupt 50% halvings.`,
    },
    {
      id: "cat_education_11",
      category: "education",
      text: `Transaction anatomy: Inputs (which UTXOs you're spending) + Outputs (who gets how much) + Signature (proves you own inputs) + Fee (goes to miners). Total in must equal total out + fee.`,
    },
    {
      id: "cat_education_12",
      category: "education",
      text: `Blue score explained: Each block gets a blue score = how many blocks in its past are "blue" (well-connected). Higher blue score = more confirmations = more secure. Used for ordering.`,
    },

    //
    // MINING
    // HIGH-VALUE: Actual hashrate data, profitability numbers, hardware specs, pool comparisons
    // NOT: "mining is profitable?", "should I mine?", vague questions
    //
    {
      id: "cat_mining_1",
      category: "mining",
      text: `Network stats: Hashrate 1.2 EH/s, difficulty 3.2T, block reward 65.5 KAS. At $0.10/KAS and $0.08/kWh, breakeven is 0.4 J/GH efficiency.`,
    },
    {
      id: "cat_mining_2",
      category: "mining",
      text: `IceRiver KS5 review: 12 TH/s at 3000W = 0.25 J/GH. ROI at current prices: 180 days. Noise: 75dB. Requires 220V outlet and dedicated cooling.`,
    },
    {
      id: "cat_mining_3",
      category: "mining",
      text: `Pool comparison: Woolypooly 0.9% fee PPLNS, F2Pool 1% PPS+, DxPool 1% PPLNS. Tested all three, Woolypooly had lowest orphan rate at 0.3%.`,
    },
    {
      id: "cat_mining_4",
      category: "mining",
      text: `Cooling setup: Intake fan 200CFM, exhaust 250CFM, negative pressure. Ambient 25C, ASIC runs at 65C. Added ducting, dropped to 55C.`,
    },
    {
      id: "cat_mining_5",
      category: "mining",
      text: `Solo mining math: At 10 TH/s vs 1.2 EH/s network, expected block time = 120,000 seconds = 33 hours. High variance, pool mining smooths income.`,
    },
    {
      id: "cat_mining_6",
      category: "mining",
      text: `Emission update: Block reward drops from 65.5 to 64.2 KAS on Dec 1st. Monthly reduction of ~2%. Plan your ROI calculations accordingly.`,
    },
    {
      id: "cat_mining_7",
      category: "mining",
      text: `KS3 operational data: Stable 8.5 TH/s after firmware update. Power consumption 3200W at wall. Daily yield: 45 KAS. Noise: 80dB - needs separate room.`,
    },
    {
      id: "cat_mining_8",
      category: "mining",
      text: `Profitability comparison today: KAS $0.32/day/TH, ETC $0.15/day/TH, LTC $0.08/day/TH. Kaspa still most profitable for kHeavyHash hardware.`,
    },
    {
      id: "cat_mining_9",
      category: "mining",
      text: `Difficulty analysis: 30-day increase 15%, 90-day increase 45%. Projected break-even electricity cost drops from $0.08 to $0.06/kWh by Q2.`,
    },
    {
      id: "cat_mining_10",
      category: "mining",
      text: `FPGA mining: Xilinx VU9P achieves 2 GH/s at 150W. Bitstream from hash-raptor.com. Not competitive with ASICs but good for experimentation.`,
    },
    {
      id: "cat_mining_11",
      category: "mining",
      text: `Power infrastructure: 100A 240V circuit supports 24kW. Running 7x KS3 miners. Installed sub-panel, PDUs with monitoring. Total draw: 22.4kW.`,
    },
    {
      id: "cat_mining_12",
      category: "mining",
      text: `Mining rewards analysis: Last 24h I mined 127 KAS with 25 TH/s on Woolypooly. That's 5.08 KAS/TH/day, slightly above theoretical due to luck.`,
    },

    //
    // PRICE TALK
    // HIGH-VALUE: Actual TA with levels, market cap math, chart analysis with data
    // NOT: "wen moon", "price prediction?", "bullish!", vague hype
    //
    {
      id: "cat_price_1",
      category: "price_talk",
      text: `KAS/USDT 4H chart: Testing $0.145 resistance. Volume profile shows 80M KAS traded at $0.12 support. Break above $0.15 targets $0.18 measured move.`,
    },
    {
      id: "cat_price_2",
      category: "price_talk",
      text: `Technical setup: RSI(14) at 28 = oversold. MACD histogram turning green. 200 EMA at $0.11 acting as support. Risk/reward 3:1 for longs here.`,
    },
    {
      id: "cat_price_3",
      category: "price_talk",
      text: `Market cap math: KAS at $3B MC. Litecoin at $6B. For KAS to flip LTC, price = $0.24. That's 80% upside from current $0.13.`,
    },
    {
      id: "cat_price_4",
      category: "price_talk",
      text: `Daily candle analysis: $0.11 wick with $450M volume = strong buying. Similar pattern on May 15 led to 40% rally in 2 weeks.`,
    },
    {
      id: "cat_price_5",
      category: "price_talk",
      text: `Wyckoff structure: Phase B accumulation since August. Spring event on Nov 12 ($0.095). Expecting SOS (sign of strength) above $0.16 to confirm markup.`,
    },
    {
      id: "cat_price_6",
      category: "price_talk",
      text: `Fibonacci analysis: From $0.05 low to $0.19 high, 0.618 retracement = $0.105. We bounced exactly there. Next targets: 0.786 ext at $0.22.`,
    },
    {
      id: "cat_price_7",
      category: "price_talk",
      text: `Order book analysis: $2M bid wall at $0.125, $500k asks to $0.15. Thin liquidity above $0.16. Breakout could gap to $0.18 quickly.`,
    },
    {
      id: "cat_price_8",
      category: "price_talk",
      text: `Power law projection: KAS following BTC 2013-2017 adoption curve. At current slope, $0.50 by Q4 2024, $1.50 by Q4 2025. Model R² = 0.94.`,
    },
    {
      id: "cat_price_9",
      category: "price_talk",
      text: `Support/resistance map: Major support $0.10, $0.12. Major resistance $0.15, $0.19 (ATH). Currently in mid-range, no clear bias until $0.15 breaks.`,
    },
    {
      id: "cat_price_10",
      category: "price_talk",
      text: `Moving average crossover: 50 EMA ($0.128) crossing above 200 EMA ($0.125) = golden cross. Last time this happened (March), price rallied 65% in 6 weeks.`,
    },
    {
      id: "cat_price_11",
      category: "price_talk",
      text: `Volume analysis: 24h volume $45M, 30-day avg $38M. Volume increasing on up days, decreasing on down days = bullish accumulation pattern.`,
    },
    {
      id: "cat_price_12",
      category: "price_talk",
      text: `On-chain metrics: Active addresses up 15% WoW. Exchange outflows > inflows for 10 consecutive days. Suggests accumulation, not distribution.`,
    },
    // Trending coins / market performance posts
    {
      id: "cat_price_13",
      category: "price_talk",
      text: `🏆 Top 5 Trending Cryptos today: #BTC +3.5%, #KAS +15.2%, #ETH +2.1%, #SOL -1.5%, #DOGE +8.3%. KAS leading the altcoin rally!`,
    },
    {
      id: "cat_price_14",
      category: "price_talk",
      text: `Top Trending Coins (Today): 1. $MON 2. $PENGU 3. $BTC 4. $KAS 5. $RAIN. Kaspa holding strong in the top 5 trending.`,
    },
    {
      id: "cat_price_15",
      category: "price_talk",
      text: `As the market bounced back, most altcoins have finally started to grow. Here are Top 5 growth leaders over the last 24h: $KAS +12%, $SOL +8%`,
    },
    {
      id: "cat_price_16",
      category: "price_talk",
      text: `Top 10 Coin Searches of the Week: $BTC, $KAS, $ETH, $XRP, $SOL. Kaspa gaining search interest as price pumps.`,
    },
    {
      id: "cat_price_17",
      category: "price_talk",
      text: `🔝 10 Trending Coins today: 1. MON 2. PI 3. TURBO 4. KAS 5. HYPE. Multiple coins showing momentum.`,
    },
    {
      id: "cat_price_18",
      category: "price_talk",
      text: `Top gainers today: $KAS +20%, $FLARE +12%, $SKY +9%. Market showing bullish momentum across altcoins.`,
    },
    {
      id: "cat_price_19",
      category: "price_talk",
      text: `Principales ganadores del mercado crypto hoy: $BTC $ETH $KAS $SOL. Top performers and price movers.`,
    },
    {
      id: "cat_price_20",
      category: "price_talk",
      text: `$KAS pumped +15% in the last 24 hours! Leading the altcoin charts. Here's why it's trending on CoinGecko.`,
    },

    //
    // EXCHANGE
    // HIGH-VALUE: Confirmed listings, actual trading data, deposit/withdrawal status, liquidity info
    // NOT: "wen Binance", "which exchange?", rumors without confirmation
    //
    {
      id: "cat_exchange_1",
      category: "exchange",
      text: `Official: Binance lists KAS/USDT and KAS/BTC pairs on Nov 15th, 10:00 UTC. Deposits open now, trading starts in 24 hours. Withdrawal minimum: 10 KAS.`,
    },
    {
      id: "cat_exchange_2",
      category: "exchange",
      text: `KuCoin maintenance notice: KAS withdrawals suspended until 14:00 UTC for wallet upgrade. Deposits working. ETA 4 hours. Status page: status.kucoin.com`,
    },
    {
      id: "cat_exchange_3",
      category: "exchange",
      text: `Bybit KAS perpetual launched: Up to 20x leverage, $5M initial open interest, funding rate 0.01% per 8h. Trading fees 0.02% maker / 0.06% taker.`,
    },
    {
      id: "cat_exchange_4",
      category: "exchange",
      text: `Exchange comparison: MEXC 0.1% fee, 30 confirms. Gate.io 0.2% fee, 60 confirms. KuCoin 0.1% fee, 50 confirms. Fastest withdrawal: MEXC at ~2 minutes.`,
    },
    {
      id: "cat_exchange_5",
      category: "exchange",
      text: `Arbitrage opportunity: KAS on Gate.io $0.132, MEXC $0.134. Spread 1.5%. After fees and withdrawal time, ~0.8% profit per cycle. Bots closing gap fast.`,
    },
    {
      id: "cat_exchange_6",
      category: "exchange",
      text: `Coinbase listing update: Rosetta API implementation complete and submitted. Currently in Coinbase review queue. No ETA but engineering work is done.`,
    },
    {
      id: "cat_exchange_7",
      category: "exchange",
      text: `KYC-free exchanges for KAS: TradeOgre (no KYC, 0.2% fee), CoinEx (no KYC under 10k daily). Note: Liquidity lower than Tier 1 exchanges.`,
    },
    {
      id: "cat_exchange_8",
      category: "exchange",
      text: `Deposit speed test: Sent 100 KAS to MEXC, arrived in wallet after 32 confirmations = 35 seconds. Credited to trading balance in 2 minutes total.`,
    },
    {
      id: "cat_exchange_9",
      category: "exchange",
      text: `Trading pair analysis: KAS/USDT has $40M daily volume, KAS/BTC only $2M. Low BTC pair liquidity = higher slippage. Stick to USDT for large trades.`,
    },
    {
      id: "cat_exchange_10",
      category: "exchange",
      text: `On-chain alert: Binance hot wallet received 50M KAS from cold storage. Usually precedes listing or increased withdrawal capacity. Watch for announcement.`,
    },
    {
      id: "cat_exchange_11",
      category: "exchange",
      text: `New listing: Kraken adds KAS/USD and KAS/EUR pairs. First USD fiat pair available. Deposits open Dec 1, trading Dec 3. Withdrawal fee: 1 KAS.`,
    },
    {
      id: "cat_exchange_12",
      category: "exchange",
      text: `Exchange reserves tracker: Total KAS on exchanges = 2.1B (8.7% of supply). Down from 2.5B last month. Decreasing exchange balance = bullish signal.`,
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

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
  | "community"
  | "education"
  | "mining"
  | "price_talk"
  | "memes"
  | "exchange_listing";

// each category can (and should) have multiple centroids (manually certified data)
// the cleaner and accurate data label are, the more accurate the system is
const categoryDescriptions: { id: string; category: Category; text: string }[] =
  [
    //
    // RESEARCH
    //
    {
      id: "cat_research_1",
      category: "research",
      text: `Reading the new Kaspa paper on blockDAG security assumptions and finality guarantees. Love how they formalize GhostDAG and pruning in a way that's actually implementable.`,
    },
    {
      id: "cat_research_2",
      category: "research",
      text: `Kaspa's research frontier is wild: GhostDAG, PHANTOM, DAG-based consensus, and now vProgs + ZK proofs. This is one of the few PoW projects still pushing actual protocol science.`,
    },
    {
      id: "cat_research_3",
      category: "research",
      text: `Spending the evening modeling Kaspa's blockDAG as a partial order and checking liveness/safety properties. The theoretical side of this protocol is massively underrated.`,
    },
    {
      id: "cat_research_4",
      category: "research",
      text: `Kaspa is a rare combo: academic-grade research (DAGKnight, GhostDAG, pruning) that actually ships to mainnet. Most chains either write papers or ship code, Kaspa does both.`,
    },
    {
      id: "cat_research_5",
      category: "research",
      text: `The vProgs yellow paper plus DAGKnight proofs make Kaspa feel more like a research lab than a meme coin. This is the kind of cryptography + distributed systems work I came for.`,
    },

    //
    // DEVELOPMENT
    //
    {
      id: "cat_development_1",
      category: "development",
      text: `Just pushed a new Kaspa SDK update: cleaner API for building wallets, better error handling and typed responses. Developer experience on this chain is getting really nice.`,
    },
    {
      id: "cat_development_2",
      category: "development",
      text: `Working on a Rust indexer for Kaspa's blockDAG. Parallel pipeline for blocks, UTXOs and vProg events, all exposed over gRPC + WebSocket. Feels so good when everything compiles.`,
    },
    {
      id: "cat_development_3",
      category: "development",
      text: `Refactoring my Kaspa explorer backend: splitting consensus RPC, mempool watcher and vProg event listener into separate services. Microservices aren't dead, they just need good observability.`,
    },
    {
      id: "cat_development_4",
      category: "development",
      text: `Building a Kaspa wallet UI in Flutter with live DAG visualization, fee estimation and vProg interaction. This L1 deserves polished apps, not just CLI tools.`,
    },
    {
      id: "cat_development_5",
      category: "development",
      text: `Today's Kaspa dev chores: bump node version, regenerate protobuf clients, add unit tests for transaction builder and fix one sneaky race in my WebSocket listener.`,
    },

    //
    // VPROG
    //
    {
      id: "cat_vprog_1",
      category: "vprog",
      text: `Kaspa vProgs = verifiable programs: off-chain execution, on-chain verification with ZK proofs, and synchronous composability on the blockDAG. Programmability without bloating L1.`,
    },
    {
      id: "cat_vprog_2",
      category: "vprog",
      text: `vProgs turn Kaspa into a universal settlement layer: complex state machines run off-chain, then anchor proofs on the DAG. Think smart contracts, but security-first and PoW-native.`,
    },
    {
      id: "cat_vprog_3",
      category: "vprog",
      text: `Each Kaspa vProg is a self-sovereign module with its own state, accounts and gas. Cross-vProg calls are metered with ScopeGas so you don't get random global side-effects.`,
    },
    {
      id: "cat_vprog_4",
      category: "vprog",
      text: `What excites me about Kaspa vProgs is the computation DAG: dependencies between programs are explicit, so you get parallel execution + atomic settlement in the same block.`,
    },
    {
      id: "cat_vprog_5",
      category: "vprog",
      text: `vProgs are basically: "verify on L1, compute off L1". The chain only checks proofs while builders can go wild with complex logic on dedicated execution layers.`,
    },

    //
    // DAGKNIGHT
    //
    {
      id: "cat_dagknight_1",
      category: "dagknight",
      text: `DAGKnight is the next evolution of Kaspa's consensus: improved security margins, better handling of high throughput and even cleaner block ordering on the DAG.`,
    },
    {
      id: "cat_dagknight_2",
      category: "dagknight",
      text: `The cool thing about DAGKnight is how it refines GhostDAG for higher concurrency without sacrificing safety. It's literally next-gen PoW consensus in production.`,
    },
    {
      id: "cat_dagknight_3",
      category: "dagknight",
      text: `Most chains tweak parameters. Kaspa introduces entirely new algorithms like DAGKnight to push the limits of high-throughput PoW.`,
    },
    {
      id: "cat_dagknight_4",
      category: "dagknight",
      text: `Reading DAGKnight design notes: it's all about robust ordering in a highly parallel blockDAG. This isn't "marketing consensus", it's serious distributed systems work.`,
    },
    {
      id: "cat_dagknight_5",
      category: "dagknight",
      text: `Once DAGKnight is fully live, the combo of instant confirmations + stronger security assumptions is going to be a huge narrative for Kaspa.`,
    },

    //
    // NODE
    //
    {
      id: "cat_node_1",
      category: "node",
      text: `Spun up a new Kaspa node with pruning, metrics and structured logs. Sync was insanely fast for a chain with this much activity.`,
    },
    {
      id: "cat_node_2",
      category: "node",
      text: `If you really want to understand Kaspa, run a full node. Watching the blockDAG form in real time is way more educational than any chart.`,
    },
    {
      id: "cat_node_3",
      category: "node",
      text: `Deployed a Kaspa node on a tiny VPS and it's humming along at internet speed. PoW doesn't have to be heavy if the protocol is designed well.`,
    },
    {
      id: "cat_node_4",
      category: "node",
      text: `Monitoring my Kaspa node with Prometheus + Grafana: latency, orphan rates, DAG tips, everything. Feels like running an HFT engine, not a "slow blockchain".`,
    },
    {
      id: "cat_node_5",
      category: "node",
      text: `Upgraded kaspad to the latest version and the sync + validation pipeline feels smoother. Node operators are getting real QoL improvements lately.`,
    },

    //
    // KIP PROPOSALS
    //
    {
      id: "cat_kip_1",
      category: "kip_proposals",
      text: `KIP-9 proposes changes to the emission schedule. Community discussion is heating up on the governance forum.`,
    },
    {
      id: "cat_kip_2",
      category: "kip_proposals",
      text: `New Kaspa Improvement Proposal for transaction fee mechanism just dropped. This is how decentralized governance should work.`,
    },
    {
      id: "cat_kip_3",
      category: "kip_proposals",
      text: `Community voting on KIP-12 starts next week. Make sure to read the proposal and participate in governance.`,
    },
    {
      id: "cat_kip_4",
      category: "kip_proposals",
      text: `KIP discussion: Should we implement account abstraction? The proposal outlines pros and cons for the Kaspa ecosystem.`,
    },
    {
      id: "cat_kip_5",
      category: "kip_proposals",
      text: `The KIP process ensures decentralized governance for Kaspa. Every major protocol change goes through community review.`,
    },

    //
    // L2 / BUILDERS
    //
    {
      id: "cat_l2_builders_1",
      category: "l2_builders",
      text: `Kaspa is the settlement layer, builders bring the magic. Working on an L2 that settles to the blockDAG while keeping UX web2-smooth.`,
    },
    {
      id: "cat_l2_builders_2",
      category: "l2_builders",
      text: `Designing a Kaspa-based payment app: instant PoW settlement on L1, friendly UI on top. No bridges, no nonsense, just fast finality for real-world use cases.`,
    },
    {
      id: "cat_l2_builders_3",
      category: "l2_builders",
      text: `The builders meta on Kaspa is underrated: infra, wallets, explorers, PoS terminals, indexers, rollup experiments… it's starting to feel like an actual developer ecosystem.`,
    },
    {
      id: "cat_l2_builders_4",
      category: "l2_builders",
      text: `Working on a Kaspa L2 that uses vProgs for verification and keeps heavy compute off-chain. Goal: DeFi-level expressiveness, PoW-level security.`,
    },
    {
      id: "cat_l2_builders_5",
      category: "l2_builders",
      text: `Hackathon idea: a builder toolkit that makes spinning up Kaspa-integrated apps as easy as "npm create". Wallet connect, vProg client, indexer, all bundled.`,
    },

    //
    // ECOSYSTEM
    //
    {
      id: "cat_ecosystem_1",
      category: "ecosystem",
      text: `Kaspa ecosystem is growing with 50+ projects now building. The network effect is starting to kick in.`,
    },
    {
      id: "cat_ecosystem_2",
      category: "ecosystem",
      text: `New partnership between Kaspa and major infrastructure provider announced. This is huge for adoption.`,
    },
    {
      id: "cat_ecosystem_3",
      category: "ecosystem",
      text: `Kaspa adoption in emerging markets is accelerating. Real-world use cases are driving organic growth.`,
    },
    {
      id: "cat_ecosystem_4",
      category: "ecosystem",
      text: `The Kaspa community has grown to 100k members. Organic growth without paid marketing.`,
    },
    {
      id: "cat_ecosystem_5",
      category: "ecosystem",
      text: `Kaspa foundation announces developer grants program. $1M allocated for ecosystem development.`,
    },

    //
    // TOOLS
    //
    {
      id: "cat_tools_1",
      category: "tools",
      text: `New Kaspa block explorer with advanced analytics just launched. You can now track DAG visualization in real-time.`,
    },
    {
      id: "cat_tools_2",
      category: "tools",
      text: `Released a Kaspa wallet SDK for developers. Makes integration a breeze with TypeScript support.`,
    },
    {
      id: "cat_tools_3",
      category: "tools",
      text: `Kaspa address generator tool now supports batch creation. Perfect for merchants and exchanges.`,
    },
    {
      id: "cat_tools_4",
      category: "tools",
      text: `Built a Kaspa transaction decoder for debugging. Helps developers understand UTXO structures.`,
    },
    {
      id: "cat_tools_5",
      category: "tools",
      text: `New Kaspa API service for developers launched. REST and WebSocket endpoints with 99.9% uptime.`,
    },

    //
    // COMMUNITY
    //
    {
      id: "cat_community_1",
      category: "community",
      text: `Kaspa community feels like early Bitcoin: small but insanely committed, more builders than influencers, more code than hype.`,
    },
    {
      id: "cat_community_2",
      category: "community",
      text: `Love how the Kaspa Discord is half research, half dev support, half memes. Yes, that's three halves, the math checks out.`,
    },
    {
      id: "cat_community_3",
      category: "community",
      text: `Every time I join a Kaspa space, I discover a new builder shipping something cool on the blockDAG. This ecosystem grows by shipping, not by shilling.`,
    },
    {
      id: "cat_community_4",
      category: "community",
      text: `Huge shoutout to the Kaspa volunteers maintaining docs, translations and community tools. None of this works without you.`,
    },
    {
      id: "cat_community_5",
      category: "community",
      text: `Kaspa feels like a research lab, a startup and a grassroot community all in one. It's chaotic, but in the best possible way.`,
    },

    //
    // EDUCATION
    //
    {
      id: "cat_education_1",
      category: "education",
      text: `Thread explaining how Kaspa GHOSTDAG works. Breaking down the consensus mechanism for beginners.`,
    },
    {
      id: "cat_education_2",
      category: "education",
      text: `Video tutorial: Understanding blockDAG vs blockchain. Why parallel blocks matter for scalability.`,
    },
    {
      id: "cat_education_3",
      category: "education",
      text: `Kaspa for beginners: What makes it different from Bitcoin. A deep dive into the technical innovations.`,
    },
    {
      id: "cat_education_4",
      category: "education",
      text: `Deep dive into Kaspa tokenomics and emission schedule. Understanding the fair launch and distribution.`,
    },
    {
      id: "cat_education_5",
      category: "education",
      text: `ELI5: Why Kaspa can process 10 blocks per second while Bitcoin does 1 every 10 minutes. It's all about the DAG.`,
    },

    //
    // MINING
    //
    {
      id: "cat_mining_1",
      category: "mining",
      text: `New ASIC miner for Kaspa achieves 200 TH/s. The hashrate competition is heating up.`,
    },
    {
      id: "cat_mining_2",
      category: "mining",
      text: `Kaspa mining profitability calculator updated with latest difficulty. Still profitable at current prices.`,
    },
    {
      id: "cat_mining_3",
      category: "mining",
      text: `Best mining pools for Kaspa in 2024. Comparing fees, payout methods, and reliability.`,
    },
    {
      id: "cat_mining_4",
      category: "mining",
      text: `My Kaspa mining rig setup and daily earnings. Running 5 ASICs with solar power.`,
    },
    {
      id: "cat_mining_5",
      category: "mining",
      text: `Kaspa hashrate just hit new all-time high. Network security stronger than ever.`,
    },

    //
    // PRICE TALK
    //
    {
      id: "cat_price_1",
      category: "price_talk",
      text: `KAS looking bullish on the 4h chart. Breaking out of the accumulation zone.`,
    },
    {
      id: "cat_price_2",
      category: "price_talk",
      text: `Kaspa price prediction for end of year. Technical analysis suggests upside potential.`,
    },
    {
      id: "cat_price_3",
      category: "price_talk",
      text: `Just bought more KAS at this dip. DCA strategy working well so far.`,
    },
    {
      id: "cat_price_4",
      category: "price_talk",
      text: `KAS breaking out of the accumulation zone. Volume increasing significantly.`,
    },
    {
      id: "cat_price_5",
      category: "price_talk",
      text: `Technical analysis: KAS forming a cup and handle pattern. Could see major move soon.`,
    },

    //
    // MEMES
    //
    {
      id: "cat_memes_1",
      category: "memes",
      text: `Me: "I'll just check Kaspa price once today." Also me 5 minutes later: refreshing the DAG like it's TikTok.`,
    },
    {
      id: "cat_memes_2",
      category: "memes",
      text: `Everyone: "Number go up?" Kaspa devs: "We just shipped a new consensus algorithm." Me: "So… number go up with extra steps?"`,
    },
    {
      id: "cat_memes_3",
      category: "memes",
      text: `Kaspa holders when blocks confirm in under a second: "If it's not final before my coffee gets cold, I don't want it."`,
    },
    {
      id: "cat_memes_4",
      category: "memes",
      text: `explaining blockDAG to friends: "imagine if a blockchain had anxiety and decided to mine all forks at once."`,
    },
    {
      id: "cat_memes_5",
      category: "memes",
      text: `Can't wait for the day when my grandkids ask: "Grandpa, what was a mempool?" and I answer: "We used to queue transactions before Kaspa."`,
    },

    //
    // EXCHANGE LISTING
    //
    {
      id: "cat_exchange_1",
      category: "exchange_listing",
      text: `Kaspa now listed on Binance! Finally the exposure this project deserves.`,
    },
    {
      id: "cat_exchange_2",
      category: "exchange_listing",
      text: `New KAS trading pair on Kraken. More liquidity options for traders.`,
    },
    {
      id: "cat_exchange_3",
      category: "exchange_listing",
      text: `Coinbase listing for Kaspa when? The community keeps asking and hoping.`,
    },
    {
      id: "cat_exchange_4",
      category: "exchange_listing",
      text: `KAS deposits now open on major exchange. Withdrawals enabled in 24 hours.`,
    },
    {
      id: "cat_exchange_5",
      category: "exchange_listing",
      text: `Kaspa trading volume hits $100M on new exchange. Liquidity is improving rapidly.`,
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

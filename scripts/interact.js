const hre = require("hardhat");

async function main() {
  const SCALE = 10**10;
  
  // INSERISCI QUI l'indirizzo stampato dal comando di deploy
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

  // Recuperiamo l'istanza del contratto
  const BayesianOracle = await hre.ethers.getContractFactory("BayesianOracle");
  const oracle = await BayesianOracle.attach(CONTRACT_ADDRESS);

  // Definiamo gli ID (devono essere uguali a quelli usati nel deploy)
  const factId = hre.ethers.id("PPH");
  const evidGpsId = hre.ethers.id("GPS");
  const evidPcId = hre.ethers.id("PC");

  console.log("--- Inizio Simulazione Oracolo Off-chain ---");

  // 1. Verifichiamo la probabilità iniziale
  let p0 = await oracle.calculatePosterior(factId);
  console.log(`1. Probabilità iniziale P(PPH): ${Number(p0) / SCALE}`);

  // 2. Simuliamo l'osservazione dell'evidenza GPS = TRUE
  console.log("\n[Sensore GPS]: Rilevato movimento coerente. Invio evidenza TRUE...");
  const tx1 = await oracle.submitEvidence(factId, evidGpsId, true);
  await tx1.wait(); // Attendiamo la conferma della transazione

  let p1 = await oracle.calculatePosterior(factId);
  console.log(`2. Nuova probabilità P(PPH | GPS=T): ${Number(p1) / SCALE}`);

  // 3. Simuliamo l'osservazione dell'evidenza PC = TRUE
  console.log("\n[Database]: Credenziali professionali verificate. Invio evidenza TRUE...");
  const tx2 = await oracle.submitEvidence(factId, evidPcId, true);
  await tx2.wait();

  let p2 = await oracle.calculatePosterior(factId);
  console.log(`3. Probabilità Finale P(PPH | GPS=T, PC=T): ${Number(p2) / SCALE}`);

  console.log("\n--- Simulazione completata ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
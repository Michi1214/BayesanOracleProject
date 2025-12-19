/* Script con doppio compito:
- Caricare lo smart contract sulla blockchain locale
- Inizializzare la rete Bayesiana inviando le probabilità a priori (Priors) e le tabelle di probabilità condizionate (CPT), agendo quindi come l'Oracolo Off-chain nella fase di setup */

const hre = require("hardhat");

async function main() {
  const SCALE = 10**10; // La nostra scala per i decimali

  // 1. Deploy del contratto
  const BayesianOracle = await hre.ethers.getContractFactory("BayesianOracle");
  console.log("Inviando il contratto sulla rete...");

  const oracle = await BayesianOracle.deploy();
  await oracle.deployed(); // Aspetta la conferma del mining su v5

  const address = oracle.address; // Accede alla proprietà fissa dell'oggetto
  console.log(`Contratto BayesianOracle distribuito a: ${address}`);

  // --- FASE DI SETUP (Off-chain Oracle) ---
  
  // Esempio basato sul caso studio: Fatto = PPH (Past Public Health)
  const factId = hre.ethers.utils.id("PPH");
  const priorPPH = 0.8 * SCALE; // P(PPH) = 0.8

  console.log("Configurazione del Fatto: PPH...");
  await oracle.setupFact(factId, BigInt(priorPPH));

  // Aggiungiamo un'evidenza: GPS
  // P(GPS=T | PPH=T) = 0.9, P(GPS=T | PPH=F) = 0.1
  const evidGpsId = hre.ethers.utils.id("GPS");
  const pTFT = 0.9 * SCALE;
  const pTFF = 0.1 * SCALE;

  console.log("Aggiunta evidenza: GPS...");
  await oracle.addEvidenceToFact(factId, evidGpsId, BigInt(pTFT), BigInt(pTFF));

  // Aggiungiamo un'altra evidenza: PC (Professional Credentials)
  const evidPcId = hre.ethers.utils.id("PC");
  const pTFT_pc = 0.95 * SCALE;
  const pTFF_pc = 0.05 * SCALE;

  console.log("Aggiunta evidenza: PC...");
  await oracle.addEvidenceToFact(factId, evidPcId, BigInt(pTFT_pc), BigInt(pTFF_pc));

  console.log("--- Setup completato con successo ---");

  // 2. Test rapido: Qual è la probabilità iniziale?
  let posterior = await oracle.calculatePosterior(factId);
  console.log(`Probabilità iniziale (senza evidenze): ${Number(posterior) / SCALE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BayesianOracle - Suite di Test Completa", function () {
  let oracle;
  const SCALE = BigInt(10 ** 10);

  // Helper per convertire i decimali in BigInt (scala 10^10)
  const toScale = (value) => BigInt(Math.round(value * Number(SCALE)));

  beforeEach(async function () {
    const BayesianOracle = await ethers.getContractFactory("BayesianOracle");
    oracle = await BayesianOracle.deploy();
    await oracle.deployed();
  });

  describe("Test di Inferenza (Matematica)", function () {
    
    it("Caso 1: L'evidenza TRUE deve aumentare la probabilità del fatto", async function () {
      const factId = ethers.utils.id("PPH");
      const gpsId = ethers.utils.id("GPS");

      await oracle.setupFact(factId, toScale(0.8)); // P(F)=0.8
      await oracle.addEvidenceToFact(factId, gpsId, toScale(0.9), toScale(0.1)); // P(E|F)=0.9, P(E|~F)=0.1

      await oracle.submitEvidence(factId, gpsId, true);

      const fact = await oracle.facts(factId);
      const expected = toScale(0.72 / 0.74); // ~0.9729
      
      expect(fact.posteriorTrue).to.be.closeTo(expected, 100);
      console.log("      -> [TRUE] Probabilità salita a:", fact.posteriorTrue.toString());
    });

    it("Caso 2: L'evidenza FALSE deve diminuire la probabilità del fatto", async function () {
      const factId = ethers.utils.id("PPH");
      const gpsId = ethers.utils.id("GPS");

      await oracle.setupFact(factId, toScale(0.8)); 
      await oracle.addEvidenceToFact(factId, gpsId, toScale(0.9), toScale(0.1));

      // Se GPS è FALSE, il contratto usa i complementi (0.1 e 0.9)
      await oracle.submitEvidence(factId, gpsId, false);

      const fact = await oracle.facts(factId);
      const expected = toScale(0.08 / 0.26); // ≈ 0.3076
      
      expect(fact.posteriorTrue).to.be.closeTo(expected, 100);
      console.log("      -> [FALSE] Probabilità scesa a:", fact.posteriorTrue.toString());
    });

    it("Caso 3: Aggiornamento incrementale con evidenze multiple", async function () {
      const factId = ethers.utils.id("PPH");
      const e1 = ethers.utils.id("E1");
      const e2 = ethers.utils.id("E2");

      await oracle.setupFact(factId, toScale(0.5)); // Prior neutra
      
      // Due evidenze identiche
      await oracle.addEvidenceToFact(factId, e1, toScale(0.8), toScale(0.2));
      await oracle.addEvidenceToFact(factId, e2, toScale(0.8), toScale(0.2));

      await oracle.submitEvidence(factId, e1, true);
      const post1 = (await oracle.facts(factId)).posteriorTrue;
      
      await oracle.submitEvidence(factId, e2, true);
      const post2 = (await oracle.facts(factId)).posteriorTrue;

      // La probabilità deve crescere ad ogni passo
      expect(post2).to.be.gt(post1);
      console.log("      -> [MULTI] Step 1:", post1.toString(), "| Step 2:", post2.toString());
    });
  });

  describe("Sicurezza e Vincoli", function () {
    it("Non puoi sottomettere la stessa evidenza due volte", async function () {
      const factId = ethers.utils.id("FACT");
      const evidId = ethers.utils.id("EVID");

      await oracle.setupFact(factId, toScale(0.5));
      await oracle.addEvidenceToFact(factId, evidId, toScale(0.6), toScale(0.4));
      
      // Prima sottomissione: OK
      await oracle.submitEvidence(factId, evidId, true);
      
      // Seconda sottomissione: usiamo try-catch invece di revertedWith
      try {
        await oracle.submitEvidence(factId, evidId, true);
        throw new Error("Transazione fallita");
      } catch (error) {
        // Verifichiamo che l'errore contenga il messaggio del tuo 'require'
        expect(error.message).to.contain("Evidenza gia' registrata");
        console.log("      -> [SICUREZZA] Errore catturato correttamente:", error.message);
      }
    });
  });
});
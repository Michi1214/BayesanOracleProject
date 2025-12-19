const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BayesianOracle - Test Suite Completa", function () {
  let oracle;
  const SCALE = BigInt(10 ** 10);

  const toScale = (value) => BigInt(Math.round(value * Number(SCALE)));

  beforeEach(async function () {
    const BayesianOracle = await ethers.getContractFactory("BayesianOracle");
    oracle = await BayesianOracle.deploy();
    await oracle.deployed();
  });

  it("Caso 1: Conferma del Fatto (Evidenza TRUE)", async function () {
    const factId = ethers.utils.id("PPH");
    const gpsId = ethers.utils.id("GPS");

    await oracle.setupFact(factId, toScale(0.8)); // P(F)=0.8
    await oracle.addEvidenceToFact(factId, gpsId, toScale(0.9), toScale(0.1)); // P(E|F)=0.9, P(E|~F)=0.1

    await oracle.submitEvidence(factId, gpsId, true);

    const fact = await oracle.facts(factId);
    const expected = toScale(0.72 / 0.74); // ~0.9729
    expect(fact.posteriorTrue).to.be.closeTo(expected, 100);
    console.log("   [TRUE] Posterior aumenta a:", fact.posteriorTrue.toString());
  });

  it("Caso 2: Smentita del Fatto (Evidenza FALSE)", async function () {
    const factId = ethers.utils.id("PPH");
    const gpsId = ethers.utils.id("GPS");

    await oracle.setupFact(factId, toScale(0.8)); 
    await oracle.addEvidenceToFact(factId, gpsId, toScale(0.9), toScale(0.1));

    // Se GPS è FALSE, usiamo i complementi: P(~E|F)=0.1 e P(~E|~F)=0.9
    await oracle.submitEvidence(factId, gpsId, false);

    // Calcolo: 
    // Num = 0.8 * 0.1 = 0.08
    // Den = (0.8 * 0.1) + (0.2 * 0.9) = 0.08 + 0.18 = 0.26
    // Posterior = 0.08 / 0.26 ≈ 0.3076
    const expected = toScale(0.08 / 0.26);

    const fact = await oracle.facts(factId);
    expect(fact.posteriorTrue).to.be.closeTo(expected, 100);
    console.log("   [FALSE] Posterior scende a:", fact.posteriorTrue.toString());
  });

  it("Caso 3: Evidenze multiple contrastanti (TRUE + FALSE)", async function () {
    const factId = ethers.utils.id("PPH");
    const e1 = ethers.utils.id("E1");
    const e2 = ethers.utils.id("E2");

    await oracle.setupFact(factId, toScale(0.5)); // Prior neutra
    
    // E1 punta verso il TRUE, E2 punta verso il FALSE
    await oracle.addEvidenceToFact(factId, e1, toScale(0.8), toScale(0.2));
    await oracle.addEvidenceToFact(factId, e2, toScale(0.2), toScale(0.8));

    await oracle.submitEvidence(factId, e1, true);
    await oracle.submitEvidence(factId, e2, true); // Entrambe osservate come vere

    const fact = await oracle.facts(factId);
    // Poiché si annullano a vicenda (0.8*0.2 = 0.2*0.8), la posterior dovrebbe tornare 0.5
    expect(fact.posteriorTrue).to.be.closeTo(toScale(0.5), 100);
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
/* Questo contratto memorizza le probabilità e aggiorna lo stato quando riceve evidenze. Per semplicità vengono usati numeri interi (moltiplicati per un fattore come 10^4 per simulare i decimali) */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BayesianOracle {
    uint256 constant SCALE = 10**10;

    struct Fact {
        uint256 priorTrue;
        uint256 posteriorTrue;
        // Memorizziamo il prodotto progressivo delle likelihood
        uint256 currentLikelihoodTrue;
        uint256 currentLikelihoodFalse;
        bytes32[] evidenceIds;
    }

    struct EvidenceCPT {
        uint256 pTrueGivenFactTrue;
        uint256 pTrueGivenFactFalse;
        bool isObserved;
        bool lastValue;
    }

    mapping(bytes32 => Fact) public facts;
    mapping(bytes32 => mapping(bytes32 => EvidenceCPT)) public evidenceData;

    event FactUpdated(bytes32 indexed factId, uint256 newPosterior);

    function setupFact(bytes32 _factId, uint256 _priorTrue) external {
        Fact storage f = facts[_factId];
        f.priorTrue = _priorTrue;
        f.posteriorTrue = _priorTrue;
        // Inizializziamo i prodotti a 1 (rappresentato come SCALE)
        f.currentLikelihoodTrue = SCALE;
        f.currentLikelihoodFalse = SCALE;
    }

    function addEvidenceToFact(
        bytes32 _factId, 
        bytes32 _evidId, 
        uint256 _pTFT, 
        uint256 _pTFF
    ) external {
        evidenceData[_factId][_evidId] = EvidenceCPT(_pTFT, _pTFF, false, false);
        facts[_factId].evidenceIds.push(_evidId);
    }

    function submitEvidence(bytes32 _factId, bytes32 _evidId, bool _value) external {
        EvidenceCPT storage e = evidenceData[_factId][_evidId];
        Fact storage f = facts[_factId];

        require(!e.isObserved, "Evidenza gia' registrata");
        e.isObserved = true;
        e.lastValue = _value;

        // AGGIORNAMENTO INCREMENTALE: Moltiplichiamo lo stato corrente per la nuova evidenza
        if (_value) {
            f.currentLikelihoodTrue = (f.currentLikelihoodTrue * e.pTrueGivenFactTrue) / SCALE;
            f.currentLikelihoodFalse = (f.currentLikelihoodFalse * e.pTrueGivenFactFalse) / SCALE;
        } else {
            f.currentLikelihoodTrue = (f.currentLikelihoodTrue * (SCALE - e.pTrueGivenFactTrue)) / SCALE;
            f.currentLikelihoodFalse = (f.currentLikelihoodFalse * (SCALE - e.pTrueGivenFactFalse)) / SCALE;
        }

        // Calcolo finale della posterior (Formula di Bayes)
        // Num = P(F=T) * P(E|F=T)
        uint256 num = (f.priorTrue * f.currentLikelihoodTrue) / SCALE;
        // Den = P(F=T)*P(E|F=T) + P(F=F)*P(E|F=F)
        uint256 priorFalse = SCALE - f.priorTrue;
        uint256 den = num + (priorFalse * f.currentLikelihoodFalse) / SCALE;

        f.posteriorTrue = (num * SCALE) / den;

        emit FactUpdated(_factId, f.posteriorTrue);
    }
}
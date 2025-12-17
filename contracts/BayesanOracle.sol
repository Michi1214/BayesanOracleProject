/* Questo contratto memorizza le probabilità e aggiorna lo stato quando riceve evidenze. Per semplicità vengono usati numeri interi (moltiplicati per un fattore come 10^4 per simulare i decimali) */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BayesianOracle {
    struct Fact {
        uint256 priorTrue;  // Probabilità a priori (es. 7000 per 0.7)
        uint256 currentPosterior;
        bool hasEvidence;
    }

    struct EvidenceCPT {
        uint256 pTrueGivenFactTrue;
        uint256 pTrueGivenFactFalse;
    }

    mapping(bytes32 => Fact) public facts;
    // Mappa: ID_Fatto => ID_Evidenza => CPT
    mapping(bytes32 => mapping(bytes32 => EvidenceCPT)) public cpts;
    // Mappa: ID_Fatto => Stato Evidenze ricevute
    mapping(bytes32 => mapping(bytes32 => bool)) public evidenceObserved;

    // 1. Setup: L'oracolo off-chain configura la rete
    function setupFact(bytes32 _factId, uint256 _prior) external {
        facts[_factId] = Fact(_prior, _prior, false);
    }

    function setupEvidence(bytes32 _factId, bytes32 _evidId, uint256 _pT_FT, uint256 _pT_FF) external {
        cpts[_factId][_evidId] = EvidenceCPT(_pT_FT, _pT_FF);
    }

    // 2. Registrazione Evidenza (Inbound)
    function submitEvidence(bytes32 _factId, bytes32 _evidId, bool _observed) external {
        evidenceObserved[_factId][_evidId] = _observed;
        updatePosterior(_factId);
    }

    // 3. Motore di Inferenza (Semplificato per 2 livelli)
    function updatePosterior(bytes32 _factId) internal {
        Fact storage f = facts[_factId];
        // Qui andrebbe implementata la formula di Bayes basata sul polytree
        // Esempio concettuale: P(F|E) = (P(E|F) * P(F)) / P(E)
        // ... logica di calcolo numerico ...
    }
}
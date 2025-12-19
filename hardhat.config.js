// Script che legge i dati dalla rete e li invia al contratto

require("@nomicfoundation/hardhat-toolbox");
require("eth-gas-reporter"); // <--- Aggiungi questa riga

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  gasReporter: {
    enabled: true,        // Abilita il report
    currency: "EUR",      // Mostra i costi stimati in Euro
    noColors: false,      // Mantieni i colori nel terminale
    outputFile: "gas-report.txt", // Opzionale: salva il report su file
    noColors: true,       // Necessario se scrivi su file
  }
};

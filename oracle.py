# L'oracolo off-chain deve monitorare le sorgenti dati (es. API meteo, sensori IoT) e interagire con il contratto

from web3 import Web3

class OffChainOracle:
    def __init__(self, contract_address, abi):
        self.w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
        self.contract = self.w3.eth.contract(address=contract_address, abi=abi)

    def initialize_network(self):
        # Invia le Prior e le CPT definite nel progetto
        # Esempio: P(PPH) = 0.8
        tx = self.contract.functions.setupFact(Web3.keccak(text="PPH"), 8000).transact()
        print(f"Rete configurata: {tx.hex()}")

    def send_data(self, fact_id, evidence_id, status):
        # Invia l'evidenza osservata nel mondo reale
        tx = self.contract.functions.submitEvidence(fact_id, evidence_id, status).transact()
        return tx
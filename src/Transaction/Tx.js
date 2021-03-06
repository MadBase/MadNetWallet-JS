const TxHasher = require('../GoWrappers/TxHasher.js');
const utils = require('./Utils.js');

/**
 * Transaction object creation
 * @class Tx
 */
class Tx {
    /**
     * Creates an instance of Tx.
     * @param {Object} Wallet
     */
    constructor(Wallet) {
        this.Wallet = Wallet;

        this.Vin = [];
        this.Vout = [];

        this.txInOwners = [];
        this.txOutOwners = [];
    }

    /**
     * Get transaction object with Vin and Vout
     * @return {Object} 
     */
    getTx() {
        return {
            "Tx": {
                "Vin": this.Vin,
                "Vout": this.Vout
            }
        }
    }

    /**
     * Create TxIn
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     */
    TxIn(consumedTxHash, consumedTxIdx) {
        this.Vin.push({
            "Signature": "C0FFEE",
            "TXInLinker": this.TxInLinker(
                consumedTxHash,
                consumedTxIdx
            )
        })
    }

    /**
     * Create TXInLinker
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     * @return {Object} 
     */
    TxInLinker(consumedTxHash, consumedTxIdx) {
        return {
            "TxHash": "C0FFEE",
            "TXInPreImage": this.TxInPreImage(
                consumedTxHash,
                consumedTxIdx
            )
        }
    }

    /**
     * Create TXInPreimage
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     * @return {Object} 
     */
    TxInPreImage(consumedTxHash, consumedTxIdx) {
        return {
            "ChainID": this.Wallet.chainId,
            "ConsumedTxIdx": consumedTxIdx,
            "ConsumedTxHash": consumedTxHash
        }
    }

    /**
     * Create ValueStore
     * @param {number} value
     * @param {number} txOutIdx
     * @param {hex} owner
     */
    ValueStore(value, txOutIdx, owner) {
        this.Vout.push({
            "ValueStore": {
                "TxHash": "C0FFEE",
                "VSPreImage": this.VSPreImage(
                    value,
                    txOutIdx,
                    owner
                )
            }
        });
        return this.Vout[this.Vout.length - 1];
    }

    /**
     * Create VSPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {hex} owner
     * @return {Object} 
     */
    VSPreImage(value, txOutIdx, owner) {
        return {
            "ChainID": this.Wallet.chainId,
            "Value": value,
            "TXOutIdx": txOutIdx,
            "Owner": owner
        }
    }

    /**
     * Create DataStore
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     */
    DataStore(index, issuedAt, deposit, rawData, txOutIdx, owner) {
        this.Vout.push({
            "DataStore": {
                "Signature": "C0FFEE",
                "DSLinker": this.DSLinker(
                    index,
                    issuedAt,
                    deposit,
                    rawData,
                    txOutIdx,
                    owner
                )
            }
        })
        return this.Vout[this.Vout.length - 1];
    }

    /**
     * Create DSLinker
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     * @return {Object} 
     */
    DSLinker(index, issuedAt, deposit, rawData, txOutIdx, owner) {
        return {
            "TxHash": "C0FFEE",
            "DSPreImage": this.DSPreImage(
                index,
                issuedAt,
                deposit,
                rawData,
                txOutIdx,
                owner
            )
        }
    }

    /**
     * Create DSPreImage
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     * @return {Object} 
     */
    DSPreImage(index, issuedAt, deposit, rawData, txOutIdx, owner) {
        return {
            "ChainID": this.Wallet.chainId,
            "Index": index,
            "IssuedAt": issuedAt,
            "Deposit": deposit,
            "RawData": rawData,
            "TXOutIdx": txOutIdx,
            "Owner": owner
        }
    }

    /**
     * Create AtomicSwap
     * @param {number} value
     * @param {number} txOutIdx
     * @param {number} issuedAt
     * @param {number} exp
     * @param {hex} owner
     */
    AtomicSwap(value, txOutIdx, issuedAt, exp, owner) {
        this.Vout.push({
            "AtomicSwap": {
                "TxHash": "C0FFEE",
                "ASPreImage": this.ASPreImage(
                    value,
                    txOutIdx,
                    issuedAt,
                    exp,
                    owner
                )
            }
        })
        return this.Vout[this.Vout.length - 1];
    }

    /**
     * Create ASPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {number} issuedAt
     * @param {number} exp
     * @param {hex} owner
     * @return {Object} 
     */
    ASPreImage(value, txOutIdx, issuedAt, exp, owner) {
        return {
            "ChainID": this.Wallet.chainId,
            "Value": value,
            "TXOutIdx": txOutIdx,
            "IssuedAt": issuedAt,
            "Exp": exp,
            "Owner": owner
        }
    }

    /**
     * Create transaction from generated Vin and Vout
     */
    async _createTx() {
        try {
            let injected = await TxHasher.TxHasher(JSON.stringify(this.getTx()["Tx"]))
            let Tx = { "Tx": JSON.parse(injected) }
            await this._signTx(Tx)
        } catch (ex) {
            throw new Error("Tx.createTx: " + String(ex));
        }
    }

    /**
     * Sign required messages for signature fields
     */
    async _signTx(Tx) {
        try {
            let tx = JSON.parse(JSON.stringify(Tx));
            for (let i = 0; i < tx["Tx"]["Vin"].length; i++) {
                let txIn = JSON.parse(JSON.stringify(tx["Tx"]["Vin"][i]))
                let consumedHash = txIn["TXInLinker"]["TXInPreImage"]["ConsumedTxHash"];
                let consumedIdx = txIn["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"] ? txIn["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"] : "0";
                let txInObj;
                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (String(this.txInOwners[j]["txHash"]) === String(consumedHash) && String(this.txInOwners[j]["txOutIdx"]) && String(consumedIdx)) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }
                if (!txInObj) {
                    throw "TxIn owner could not be found"
                }
                let ownerAccount = await this.Wallet.Account.getAccount(txInObj["address"])
                let signed = await ownerAccount["MultiSigner"].sign("0x" + txIn["Signature"]);
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, ownerAccount["MultiSigner"]["curve"], signed);
                } else {
                    signature = await utils.prefixSVACurve(1, ownerAccount["MultiSigner"]["curve"], signed);
                }
                txIn["Signature"] = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx["Tx"]["Vout"].length; i++) {
                let txOut = JSON.parse(JSON.stringify(tx["Tx"]["Vout"][i]))
                if (txOut["DataStore"]) {
                    let owner = await utils.extractOwner(txOut["DataStore"]["DSLinker"]["DSPreImage"]["Owner"])
                    let ownerAccount = await this.Wallet.Account.getAccount(owner[2]);
                    let signed = await ownerAccount["MultiSigner"].sign("0x" + txOut["DataStore"]["Signature"]);
                    let signature = await utils.prefixSVACurve(3, ownerAccount["MultiSigner"]["curve"], signed);
                    txOut["DataStore"]["Signature"] = signature;
                }
                this.Vout[i] = txOut;
            }
        }
        catch (ex) {
            throw new Error("Tx.sign: " + String(ex));
        }
    }
}
module.exports = Tx;
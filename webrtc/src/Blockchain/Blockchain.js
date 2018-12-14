import sha256 from 'sha256'
//const currentNodeUrl = process.argv[3];//jalando la url contenida en el script cuando se inici esta
import PouchDB from 'pouchdb'
import { v1 } from 'uuid'
import PouchdbFind from 'pouchdb-find';
import DB from '../DB'

export default class  Blockchain {
        
	constructor() {
		PouchDB.plugin(PouchdbFind)////////////////////////////////
		this.chain = []////////////////////////////////
		this.pendingTransactions = []////////////////////////////////
		this.db = new PouchDB('blockchain')
	}

	a = (t) => {		
		let pendingTxPromises = []			
		//console.log('recibido en createFirstBlockHandler:',t)
		for (let tx of t){			
			const newTx = {
				amount: tx.amount,
				sender: tx['sender'],
				recipient: tx['recipient'],
				value4:tx['value4'],
				value5:tx['value5'],
				first : 1 //internal, only used when a tx is part of a new first block
				//transactionId: v1().split('-').join('') //adding a new attribute, latter this must be
				//sophisticated with cryptogtaphy.
			}	
			let a =new Promise((resolve,reject)=>{
				resolve(this.createNewTransaction(newTx))
				reject('Error saving new Transaction')
			})
			pendingTxPromises.push(a)
		}

		let pendingTransactions =  Promise.all(pendingTxPromises)
		.then(returnedSavedTxs=>{
			console.log('new saved txs: ' , returnedSavedTxs)
			return returnedSavedTxs
			//pendingTransactions.push(returnedSavedTx)
		})
		return pendingTransactions
	}
    
    createFirstBlockHandler = (t) =>{
        let res = new Promise ((resolve,reject) => {
			resolve(this.a(t))
			reject('asadsf')		
		}).then(pendingTransactions=>{
			console.log('received pending Transactions after saving them in pouch: ', pendingTransactions)
			const lastBlock = new Promise((resolve,reject)=>{
				resolve(this.createNewBlock(100, '0', '0',pendingTransactions))
				reject('Error getting First Block')
			})
			return lastBlock
		})
		return res
    }

    createNewBlock = (nonce, previousBlockHash, hash , pendingTransactions) => {
		let index = null
		let newBlock = null
		const abc = new Promise((resolve,reject)=>{
			resolve(this.getLastBlock())
			reject('Error getting lastBlock')
		})
		.then(lastBlock=>{
			console.log('lastBlock in create new block to obtain the index data: ' , lastBlock)
			if(lastBlock!==null){
				if(typeof(lastBlock.index)!=='undefined'){
					index = lastBlock.index + 1
				}
			}else{
				index = 1
			}		

			newBlock = {
				//_id: (this.chain.length + 1).toString(),
				//index: this.chain.length + 1,
				index:index,
				timestamp: Date.now(),
				transactions: pendingTransactions,
				nonce: nonce,
				hash: hash,
				previousBlockHash: previousBlockHash
			}
			//this.chain.push(newBlock);
			let r = new Promise((resolve,reject)=>{
				const db1 = new DB('blockchain')
				resolve(db1.saveBlockchain(newBlock) )
				reject('Error triying to save a block...')
			})
			return r
		})
		.then(r=>{
			console.log('response from pouch after saving block',r)
			const lastBlock = new Promise((resolve,reject) =>{
				resolve(this.getLastBlock())
				reject('Error getting last block')
			})
			return lastBlock
		})
		.then(lastBlock=>{
			//////////////////////////
			if(lastBlock!==null){
				const txsToDelete = lastBlock.transactions
				console.log('Transactions to delete from pouch local database...' , txsToDelete)
				const res = new Promise((resolve,reject)=>{
					resolve(this.deleteMinedTx(txsToDelete))
					reject('Error triying to delete transactions')
				})
				return res
			}else{
				console.log('Error something went wrong, getLastBlock returned null after create a block')
				return 'error'
			}
			//////////////////////////			
		})
		.then(res=>{
			console.log('response from pouch after deleting mined transactions...', res)
			return newBlock
		})
		return abc
	}

	deleteMinedTx = async (txsToDelete) => {		
		let len = txsToDelete.length
		let i = 0
		for(let txToDelete  of txsToDelete){
			i++
			await this.db.get(txToDelete.transactionId).then(doc => {
				console.log('get catched this transaction:' , doc)
				return this.db.remove(doc)
			})
			if(i===len){
				return i
			}
		}
	}
	
	getLastBlock = async() => {
		let options = {include_docs:true}
		let idx = 0
		let key = null
		let foundBlock = null
		let rowIndex = null
		let aux = 0
		
		await this.db.allDocs(options, (err, response) => {
			//console.log("response",response)
			if(response && response.rows.length > 0){
				let fullBlocks = response.rows
				for(let totalBlock of fullBlocks){
					//console.log('total block',totalBlock)
					let block = totalBlock.doc			
					if(typeof(block.index) === "number"){
						if(block.index > idx){
							idx = block.index
							key = totalBlock.id
							rowIndex = aux
						}				
					}
					aux++
				}

				if(idx>0){
					console.log('lastBlock index found: ' , idx)
					console.log('id del bloque',key)
					
					const {index,timestamp,transactions,nonce, hash , previousBlockHash} = 
					response['rows'][rowIndex]['doc']
					foundBlock = {index,timestamp,transactions,nonce, hash , previousBlockHash}
					console.log('las block from pouch...' , foundBlock)
				}	
			
			}else{
				console.log('seems no chain exist, nothing received ')
				
			}
			if(err){
				console.log('Error when getting las block...',err)
			}

			// handle err or response
		})
		return foundBlock
	}

	createNewTransaction = (newTx) => {		
		const newTransaction = {
			amount: newTx.amount,
			sender: newTx.sender,
			recipient: newTx.recipient,
			value4:newTx.value4,
			value5:newTx.value5,
			transactionId: v1().split('-').join('') //adding a new attribute, latter this must be
			//sophisticated with cryptogtaphy.
		}
		//this.pendingTransactions.push(newTransaction);
		//return newTransaction			
		let output = new Promise((resolve,reject)=>{
			resolve(this.getLastBlock())
			reject('Error getting last Block')
		}).then(block=>{
			let out = null		
			if(block || newTx.first ){
				console.log('block returned: ' ,  block)
				out = new Promise((resolve,reject)=>{
					resolve(this.addTransactionToPendingTransactions(newTransaction))
					reject('Error adding a new Transation to the database')
				}).then(res=>{
					console.log('res intermedio: ',res)
					return res
				})
			}
			return out
		})

		return output
	}

	addTransactionToPendingTransactions = async(newTx) => {
		//this.pendingTransactions.push(transactionObj)
		const db1 = new DB('blockchain')
		const res = await db1.saveTx(newTx)
		if(res !== null){
			console.log(`Successfully saved Tx, pouch responded with:`,res)
			return newTx
		}else{
			return null
		}
		//return this.getLastBlock()['index'] + 1;
	}

	getPendingTransactions = async () => {
		let options = {include_docs:true}
		let pendingTxs = []
		
		await this.db.allDocs(options, (err, response) => {
			//console.log("response",response)
			if(response && response.rows.length > 0){
				let res1 = response.rows
				for(let a of res1){				
					let fullPendingTx = a.doc					
					if(fullPendingTx.type=== "pendingTransaction"){
						let {amount,recipient,sender,value4,value5,transactionId} = {...fullPendingTx}
						let pendingTx = {amount,recipient,sender,value4,value5,transactionId}
						pendingTxs.push(pendingTx)
						//console.log('pendingTx: ',pendingTx)
					}
				}
			}
			
		})
		return pendingTxs
	}

	findPendingTransactionId = async (searchedId)  => {
		let options = {include_docs:true}
		let foundTxId = null
		await this.db.allDocs(options, (err, response) => {
			//console.log("response",response)
			if(response && response.rows.length > 0){
				let res1 = response.rows
				for(let row of res1){				
					let fullPendingTx = row.doc					
					if(fullPendingTx.type === "pendingTransaction"){
						let {transactionId} = {...fullPendingTx}
						if(transactionId ===searchedId){
							foundTxId = transactionId
						}
					}
				}
			}
		})
		return foundTxId
	}

	processIncomingBlock = block => {
		let index = null
		let previousBlockHash = null
		let currentBlockData = null
		let nonce = null
		let updateChain = false
		let updateExistingChain = false
		const abc = new Promise((resolve,reject)=>{
			resolve(this.getLastBlock())
			reject('Error getting lastBlock')
		})
		.then(lastBlock=>{
			console.log('lastBlock in processIncomingBlock to obtain the index data: ' , lastBlock)
			if(lastBlock!==null){
				console.log(`
				lastBlock.index: ${lastBlock.index} , IncomingBlock.index: ${block.index}`)
				let r = null
				if(typeof(lastBlock.index)!=='undefined'){
					index = lastBlock.index + 1
					previousBlockHash = lastBlock.hash
					currentBlockData = block.transactions
					nonce = block.nonce
					let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
					if(hash===block.hash && index===block.index){
						console.log('hash match!!',hash)
						r = new Promise((resolve,reject)=>{
							const db1 = new DB('blockchain')
							resolve(db1.saveBlockchain(block))
							reject('Error triying to save a block...')
						})
					}else{//chain exist but it is not maching the current incoming block
						//request another chain only if block.index>index
						if (block.index>=index){//indexs are equal but not the hashes!!
							console.log(`It seems the chain exist but is not updated, index
							of incoming block(${block.index}) is greater or equal than index of expected block(
							${index}) starting to update the chain,also hashes dont match.`)
							updateExistingChain = true
						}else{
							console.log(`Incoming block has and index (${block.index}) less
							or equal than the last local stored block (${lastBlock.index}), 
							thus BLOCK WAS REJECTED`)
						}
					}
					console.log(`calculated hash: ${hash} , Incoming hash Block: ${block.hash}`)
				}
				return r
			}else if(lastBlock===null && block.index===1){
				console.log('Chain does not exist , first Block received')/////////////////////test first block!!!!!
				let r = new Promise((resolve,reject)=>{
					const db1 = new DB('blockchain')
					resolve(db1.saveBlockchain(block))
					reject('Error triying to save a block...')
				}).then(res=>{
					//updateChain = true //in this case as incoming block is first and no chain exist so I will try
					//to check
					console.log('response after saving incoming first block',res)
					return res})//considerar si pouch no guarda el bloque, falta!!
				return r
			}else if(lastBlock==null && block.index>1){
				console.log(`Chain does not exist ,incoming Block has index of ${block.index},
				self updating to check my status will start..`)////////////////////////////
				updateChain = true
				return null
			}
		})
		.then(r=>{
			console.log('response from pouch after saving block',r)
			if(r){
				const lastBlock = new Promise((resolve,reject) =>{
					resolve(this.getLastBlock())
					reject('Error getting last block')
				})
				return lastBlock
			}else{
				return null
			}
		})
		.then(lastBlock=>{
			//////////////////////////
			if(lastBlock!==null){
				const txsToDelete = lastBlock.transactions
				console.log('Transactions to delete from pouch local database...' , txsToDelete)
				const res = new Promise((resolve,reject)=>{
					resolve(this.deleteMinedTx(txsToDelete))
					reject('Error triying to delete transactions')
				}).then(r=>{
					return true
				}).catch(e=>{
					console.log('Error saving mined transactions included in the incoming block.. ', e )
					return true //even if my database dont find the transactions, the operation is valid
					//because the block is saved
				})
				return res
			}else{
				console.log(
				'could not delete transactions already mined by another peer, block could not be saved read lines above...')
				return false
			}
			//////////////////////////
		})
		.then(res=>{
			console.log('response from pouch after deleting mined transactions...', res)
			if(updateExistingChain){
				return {'updateExistingChain':updateExistingChain}
			}
			else if(updateChain){
				return {'updateChain':updateChain}
			}else{
				return {'receivedChain':res}
			}
		})
		return abc
	}

	processIncomingTx = (searchedTxId,newTx) =>{
		let verifiedTx = null		
		verifiedTx = new Promise((resolve,reject)=>{
			resolve(this.findPendingTransactionId(searchedTxId))
			reject('Error verifiying incoming transaction...')
		}).then(r=>{
			if(r===null) console.log('transaction is allowed to be stored...');
			return r
		}).then(foundTxId=>{
			console.log('foundTxId: ' , foundTxId)
			let ver = null
			if(foundTxId === null){
				ver =  new Promise((resolve,reject)=>{
					resolve(this.addTransactionToPendingTransactions(newTx))
					reject('Error trying to add new incoming transaction')
				}).then(result => {
					console.log('result after trying to store incoming tx: ', result) ////////
					return result
				})
				return ver			
			}
		})

		return verifiedTx
	}

	hashBlock = (previousBlockHash, currentBlockData, nonce) => {
		const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
		const hash = sha256(dataAsString);
		return hash;
	}

	proofOfWork = (previousBlockHash, currentBlockData) => {
		let nonce = 0;
		let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
		while (hash.substring(0, 3) !== '000' && hash.substring(0, 6) !== '001' &&
		hash.substring(0, 6) !== '002' && hash.substring(0, 6) !== '003' &&
		hash.substring(0, 6) !== '004' &&
		hash.substring(0, 6) !== '005' &&
		hash.substring(0, 6) !== '006' &&
		hash.substring(0, 6) !== '007' &&
		hash.substring(0, 6) !== '008') {
			nonce++;
			hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
		}
		console.log('El nonce del pow es: ' + hash);
		return nonce;
	}
	
	getBlock = async (id) => {
		let a = await this.db.get(id).then(doc => {
			console.log('get method catched this block:' , doc)
			if(doc.index && doc.hash && doc.previousBlockHash && doc.nonce && doc.timestamp &&
				doc.transactions){
				let block = {'index':doc.index,'hash':doc.hash,'previousBlockHash':doc.previousBlockHash,
				'nonce':doc.nonce,'timestamp':doc.timestamp,'transactions':doc.transactions
				}
				console.log('prepared block is: ',block)
				return block
			}
		})
		return a
	}
}

/*
Blockchain.prototype.chainIsValid = function(blockchain) { //as a parameter a chain enter into this
	//function with the name blockchain
	let validChain = true;
	for (var i = 1; i < blockchain.length; i++) {		
		const prevBlock = blockchain[i - 1];
		console.log('previous block' + ' : ',prevBlock);
		const currentBlock = blockchain[i];
		console.log('block' + i+1 + ' : ',currentBlock);
		//1. verify the hashes on every block by rehashing them and verifiying the amount of zeros.
		//const hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
		let currentBlockData = { transactions: currentBlock['transactions'], index: currentBlock['index'] };
		let previousBlockHash = prevBlock['hash'];
		const blockHash = this.hashBlock(previousBlockHash, currentBlockData,currentBlock['nonce']);
		console.log('blockHash',blockHash);
		if (blockHash.substring(0, 6) !== '000000' && blockHash.substring(0, 6) !== '000001' &&
		blockHash.substring(0, 6) !== '000002' && blockHash.substring(0, 6) !== '000003' &&
		blockHash.substring(0, 6) !== '000004' &&
		blockHash.substring(0, 6) !== '000005' &&
		blockHash.substring(0, 6) !== '000006' &&
		blockHash.substring(0, 6) !== '000007' &&
		blockHash.substring(0, 6) !== '000008' ) validChain = false;
		console.log('1. verify the hashes on every block by rehashing them and verifiying the amount of zeros: ',
		validChain);
		//2. verify the hash of the previous block hash on every current block
		if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;
		console.log('hash anterior',prevBlock['hash'],'previousBlockHash en current block',
		currentBlock['previousBlockHash'])
		console.log('2. verify the hash of the previous hash on every block: ', 
		currentBlock['previousBlockHash'] == prevBlock['hash']);
	};
	//3. verify the initial values on the genesis block
	const genesisBlock = blockchain[0];
	const correctNonce = genesisBlock['nonce'] === 100;
	const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
	const correctHash = genesisBlock['hash'] === '0';
	const correctTransactions = genesisBlock['transactions'].length === 6;

	if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;
	console.log('3. verify the initial values on the genesis block: ',
	correctNonce && correctPreviousBlockHash && correctHash && correctTransactions);
	return validChain;
}

/*
Blockchain.prototype.getBlock = function(blockHash) {
	let correctBlock = null;
	this.chain.forEach(block => {
		if (block.hash === blockHash) correctBlock = block;
	});
	return correctBlock;
};





Blockchain.prototype.getAddressData = function(address) {
	const addressTransactions = [];
	this.chain.forEach(block => {
		block.transactions.forEach(transaction => {
			if(transaction.sender === address || transaction.recipient === address) {
				addressTransactions.push(transaction);
			};
		});
	});

	let balance = 0;
	addressTransactions.forEach(transaction => {
		if (transaction.recipient === address) balance += transaction.amount;
		else if (transaction.sender === address) balance -= transaction.amount;
	});

	return {
		addressTransactions: addressTransactions,
		addressBalance: balance
	};
};




*/



//module.exports = Blockchain;




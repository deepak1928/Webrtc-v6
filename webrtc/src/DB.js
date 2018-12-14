import PouchDB from 'pouchdb'
import { v1 } from 'uuid'
import PouchdbFind from 'pouchdb-find'
import Blockchain from './Blockchain/Blockchain'
//PouchDB.plugin(require('pouchdb-find'));

export default class DB {
    constructor(name){
        PouchDB.plugin(PouchdbFind)
        this.db = new PouchDB(name)
    }

    getUUID = async () => {
        let node_uuid 
        await this.db.get('my_UUID').then(result => node_uuid = result.value ).catch(e => node_uuid = e.name)        
        return node_uuid
    }

    createUUID = () =>{
        return v1()
    }

    saveUUID = async (my_UUID) => {
        const node_uuid = await new Promise(resolve=>{
            resolve(this.db.put({_id:'my_UUID',value:my_UUID}))
        })
        .then(r=>{
            console.log('response after saving node_uuid: ',r)
            if(r.ok){
                return my_UUID
            }
        })
        .catch(e=>{
            console.log('Error saving id: ', e.name )
            return null
        })
        return node_uuid
    }

    saveBlockchain = async (B) =>{
        try{
            const _id = B.index.toString()
            const block = {...B,_id}
            const res = await this.db.post(block)
            //const {id} = res
            return res
        }catch(e){
            const {message} = e
            console.log('Error on saveBlockchain method in class DB.js: ',message , e)
            return 'error'
        }
    }

    saveTx = async (newTx) =>{
        try{  
            const _id = newTx.transactionId          
            const type = 'pendingTransaction'
            const totalTx = {...newTx,type,_id}
            const res = await this.db.post(totalTx)
            //const {id} = res
            return res
        }catch(e){
            const {message} = e
            console.log('Error saving new Transaction on DB.js: ',message)
            return null
        }
    }

    saveData = props => { //cant use async funtions in render
        if(Object.keys(props.newTx).length>0){
            console.log('props.newTx: ', props.newTx)
            const newTx = props.newTx
            console.log('newTx to process in saveData: ',newTx)
            const searchedTxId = newTx.transactionId
            const blockchain = new Blockchain()
            console.log('searchedTxId: ' , searchedTxId , 'newTx' , newTx)
            let result =false
            result =  new Promise((resolve,reject) => {
                resolve(blockchain.processIncomingTx(searchedTxId,newTx))
                reject('Error')
            }).then(verifiedTx => {
                console.log('verifiedIndex', verifiedTx)
                let a = null
                if(verifiedTx){
                    console.log('verifiedIndex', verifiedTx)  //////////////////          
                    a = true     
                }
                return a
            })
            console.log('result',result)
            return result
        }
    }
}
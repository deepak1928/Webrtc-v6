import React from 'react'
import DB from '../DB'

const sendData = props => {
    const db = new DB('blockchain')
    const response = new Promise((resolve,reject)=>{
        resolve(db.getUUID())
        reject('Error geetting uuid')
    }).then(node_uuid=>{
        console.log('node_uuid got in sendData: ',node_uuid)
        const {data,type,index} = props
        if(props.peerConns.length>0){
            const dataToSend = JSON.stringify({
                'node_uuid': node_uuid,
                'type':type,'message': data,'index':index})
            
            console.log('data to send: ', dataToSend)

            props.peerConns.map(peerConn=>{
                if( typeof(peerConn['functionPc']) !== undefined ){
                    console.log('sending data to Peer: ....' )
                    peerConn['functionPc'].sendFileFcn(dataToSend)
                    return <h2>Sending request to all peers</h2>
                }else{
                    console.log('functionPc not defined in peerConn')
                    return <h2>No available peers to send transaction</h2>
                }
            })
            
        }else{
            return(<h2>Warning no peers connected yet avoid creating new Blocks until 
                connecting to another peer</h2>)
        }
    })
    return response
}

export default sendData
import React from 'react'

const sendDataTo = props => {
    const {type,peerConn} = props
    if(peerConn){
        let dataToSend = null
        if(type==='updateTo'){
            dataToSend = JSON.stringify({
                'blockIndex': props.blockIndex,
                'type':props.type})
        }else if(type==='lenChain'){
            const {data,lenChain,node_uuid,type} = props
            dataToSend = JSON.stringify({
                'message': data,
                'lenChain':lenChain,
                'node_uuid': node_uuid,           
                'type':type})
        }
        console.log('data to send: ', dataToSend)
        if( typeof(peerConn['functionPc']) !== 'undefined' ){
            console.log('sending data to Peer: ....' )
            peerConn['functionPc'].sendFileFcn(dataToSend)
            return <h3>Sending data to peer {props.peer_node_uuid}</h3>
        }else{
            console.log('functionPc not defined in peerConn')
            return <h3>No available peer to send specific data to peer</h3>
        }
        
    }else{
        return(<h3>Failed hepling reach consensus to another peer</h3>)
    }
}

export default sendDataTo
import React, { Component } from 'react'
import io from 'socket.io-client'
import DB from '../DB'
import Layout from '../Style/Layout'
import NewPeer from '../wrtconf/NewPeer'
import PendingTransactions from '../Blockchain/PendingTransactions'
import {Menu , Button} from 'semantic-ui-react'
import {Link} from 'react-router-dom'
import Blockchain from '../Blockchain/Blockchain';

const endpoint = "http://localhost:4001" // this is where we are connecting to with sockets
class Mean extends Component {
    state = {
      db:new DB('blockchain'),
      a:null
    }

    componentWillMount(){
      let nodesInfo = []
      for(let i=0 ; i < 4;i++){
        const socket = io.connect(endpoint)
        socket.on('connect', ()=>{
          console.log("triggered socket.id: ",socket.id)          
        })
        
        const data = {'state':0 , 'socket':socket}
        nodesInfo.push({...data})
      }
      console.log('NodesInfo initialized with sockets data...:',nodesInfo)
      this.setState({nodesInfo})

      //////////////////////////////////////////////
      const blockchain = new Blockchain()      
      new Promise((resolve,reject)=>{
        resolve(blockchain.getLastBlock())
        reject('Error getting Last block')
      }).then(lastBlock=>{
        if(lastBlock)this.setState({lastBlock})        
      })
    }
  
    componentDidMount(){
      console.log('nodes info at the beggining of componentDidMount: ', this.state.nodesInfo )
    new Promise((resolve,reject) => {
      resolve(this.showUUID())
      reject('Error getting UUID')
    }).then(r=> {
      for(let nodeInfo of this.state.nodesInfo){
        const {socket} = nodeInfo
        socket.on('newCandidate', candidatesSocket => socket.emit('xyz',
        candidatesSocket,this.receiveCandidateHandler))//////
        socket.on('startCallee', data => {
        console.log("receiving call from peer: ", data.candidate_socket_id)
        socket.emit('xyz',
        data,this.becomeCallee)})
        console.log('socket and uuid triggered',{'id':socket.id,'node_uuid':this.state.node_uuid})
        socket.emit('searchingPeer',{'id':socket.id,'node_uuid':this.state.node_uuid})
      }
    })
  }

  
  receiveCandidateHandler = data => {//I will be a caller
    new Promise((resolve,reject)=>{
      resolve(this.signalingMessageHandler(data))////////////////////////////
      reject("Error in receiveCandidateHandler")
    })
    .then(foundIndex => {      
      console.log(`Peer number ${foundIndex+1} is making call to peer
      ${this.state.nodesInfo[foundIndex]['peer_id']}`)
      this.state.nodesInfo[foundIndex]['functionPc'].callAction()
    })
    .catch(e => {console.log(`Error in receive signalingMessageHandler: ${e}`)})
  }

  becomeCallee = data => {//I am a callee
    new Promise((resolve,reject)=>{
      resolve(this.signalingMessageHandler(data))
      reject("Error in becomeCallee")
    }).then(foundIndex => {
      console.log(`Peer number ${foundIndex+1} is receiving call from peer
      ${this.state.nodesInfo[foundIndex]['peer_id']}`)
      this.state.nodesInfo[foundIndex]['functionPc'].callee()
    })
    .catch(e=>console.log(`Error in receive signalingMessageHandler: ${e}`))
  }

  findIndexPeer = (socketId) => {
    const nodesInfo = [...this.state.nodesInfo]
    let foundIndex = nodesInfo.findIndex(nodeInfo=>{
      return nodeInfo.socket.id === socketId
    })
    return foundIndex
  }

  signalingMessageHandler = data => {
    console.log("candidate received",data)
    console.log("signalingMessageHandler en index.js")
    const {candidate_socket_id} = data
    const socketId = data.socket
    let foundIndex = null
    let nodesInfo = null
    
    if(candidate_socket_id && socketId){
      nodesInfo = [...this.state.nodesInfo]
      foundIndex = this.findIndexPeer(socketId)
      console.log('foundIndex is: ' , foundIndex )
    }

    if(foundIndex>=0 && nodesInfo[foundIndex]['state'] === 0 ){
      nodesInfo[foundIndex]['peer_id']=candidate_socket_id
      nodesInfo[foundIndex]['socketId']=socketId
      console.log('Updated node Info: ' , nodesInfo[foundIndex])
      const socket = nodesInfo[foundIndex]['socket']
      const peer_id = nodesInfo[foundIndex]['peer_id']


      let functionPc = new NewPeer({'socket':socket , 'peer_id':peer_id , 
      'showState':this.showPeersHandler,'receiveData':this.receiveData , 
      'node_uuid':this.state.node_uuid , 'lenLongestChainHandler':this.lenLongestChainHandler,
      'updateLenLongestChainHandler':this.updateLenLongestChainHandler,
      'updateLastBlockHandler':this.updateLastBlockHandler, 
      'requestAllowedCandidateHandler':this.requestAllowedCandidateHandler,
      'findNewLongestChainHandler':this.findNewLongestChainHandler,
      'longestChainCandidatesHandler':this.longestChainCandidatesHandler })
      nodesInfo[foundIndex]['functionPc'] = functionPc
      nodesInfo[foundIndex]['state'] = 1
      this.setState({nodesInfo},console.log('nodesInfo in signalingMessageHandler: ' , nodesInfo))
      return foundIndex
    }else if(foundIndex>=0 && nodesInfo[foundIndex]['state'] === 1){
      console.log('something went wrong in method signalingMessageHandler, status of nodeInfo is busy: ',
      nodesInfo[foundIndex])
      return false
    }else {
      console.log('something went wrong in method signalingMessageHandler')
    }
  }

  findNewLongestChainHandler = () =>{
    this.props.findNewLongestChainHandler()
  }

  requestAllowedCandidateHandler = (data) => {
    return this.props.requestAllowedCandidateHandler(data)
  }

  updateLastBlockHandler = (lastBlock) => {
    this.setState({lastBlock})     
  }

  lenLongestChainHandler = () => {
    return this.props.lenLongestChainHandler()    
  }

  updateLenLongestChainHandler = (data) => {
    this.props.updateLenLongestChainHandler(data)
  }
  

  showUUID = async () => {
    let node_uuid = this.state.db.createUUID()
    let msg = null
    let aux = null
    aux = await this.state.db.getUUID()
    .then(r=>{
      if(r==='not_found'){
        console.log('creando uuid...')
        const fcn_uuid = async()=>{await this.state.db.saveUUID(node_uuid)}
        fcn_uuid(node_uuid)
        console.log('uuid',node_uuid)
        msg='uuid created!... : '
      }else{
        node_uuid = r
        msg='uuid catched!... : '
      }
      this.setState({node_uuid},()=>console.log(msg , node_uuid))
      return true
    }).catch(e=>{console.log(`Error in method showUUID: ${e.name}`)
    })
    console.log('aux: ',aux)
    return aux
  }
 
  /////////////////////////////////////////////////////////////////////////////////////
  showPeersHandler = data => {
    const {peerState,socketId} = data
    const foundIndex = this.findIndexPeer(socketId)
    //eliminar el nodeinfo (la functionpc) y reemplazarlo por uno nuevo
    let nodesInfo = [...this.state.nodesInfo]
    nodesInfo[foundIndex]['peerState']=peerState
    console.log('...........Updating nodesInfo...............')
    if(peerState === 'closed'){
      //delete
      nodesInfo[foundIndex]['state'] = 0
      delete nodesInfo[foundIndex]['functionPc']
      delete nodesInfo[foundIndex]["peer_id"]
      this.setState({nodesInfo:nodesInfo})
    }else{
      this.setState({nodesInfo:nodesInfo})
    }
    this.props.newConnHandler({'peerState':peerState,'id':socketId,'newConn':this.state.nodesInfo[foundIndex]['functionPc']})
  }
  /////////////////////////////////////////////////////////////////////////////////////

  showState = () => {
    const nodesInfo = [...this.state.nodesInfo]
    console.log('Preparing nodes info to show them, state...:' , nodesInfo)
    let i = 0
    return nodesInfo.map( nodeInfo => {
      let peerState = nodeInfo['peerState']
      i++
      if(typeof(peerState) !== 'undefined'){
        return(<h3>Ice connection number {i} is : {peerState}</h3>)
      }else if(typeof(nodeInfo.functionPc)!=='undefined'){//if nodeInfo.pc is not defined
        return(<h3>Receiving call... please wait</h3>)
      }
    })
  }

  longestChainCandidatesHandler = data =>{
    this.props.longestChainCandidatesHandler(data)
  }

  receiveData = data =>{
    this.props.receiveDataIndex(data)
  }

  showIncomingTx = () => { //cant use async funtions in render    
    let a = null
    if(typeof(this.props.newTx)!=='undefined'){  
      a =  
      <div>
          <h2>New transaction  received from peer {this.props.newTx.node_uuid} has
          been added successfully : </h2>
          <PendingTransactions pending_transactions={[this.props.newTx.message]} />
      </div>
    }
    return a
       // this.setState({incomingTx:a})
  }

  operations = () => {
    if(this.state.lastBlock || this.props.createdBlockChain){
      return(
        <Menu>
          <Menu.Menu position = "left" style={{ marginBottom: "1px" }} >        
            <Link to="/home">                        
              <Button
                content="Home"
                icon="add circle"
                labelPosition="right"
                floated="right"
                primary
                disabled = {false}                
              />
            </Link>
          </Menu.Menu>

          <Menu.Menu position = "right" style={{ marginBottom: "1px" }} >        
            <Link to="/operations/mineBlock">                        
              <Button
                content="Operations"
                icon="add circle"
                labelPosition="right"
                floated="right"
                primary
                disabled = {false}
                //onClick = {this.a}
              />
            </Link>
          </Menu.Menu>
          
        </Menu>
      )
    }else{
      return(
        <Menu>
          <Menu.Menu position = "left" style={{ marginBottom: "1px" }} >        
            <Link to="/operations/createBlockchain">
              <Button
                content="Create Genesis Block"
                icon="add circle"
                labelPosition="right"
                floated="right"
                primary
                disabled = {false}
                //onClick = {this.a}
              />
            </Link>
          </Menu.Menu>
        </Menu>
      )
    }  
  }

  render() {
    
    return (
      <Layout>
        {this.operations()}
        <h3>Node identifier: {this.state.node_uuid}</h3>        
        {this.showState()}
        {this.showIncomingTx()}
      </Layout>
    )
  }
}

export default Mean
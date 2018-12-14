import React, { Component } from 'react'
import Mean from './pages/index'
import {BrowserRouter , Route} from 'react-router-dom'
import ClientMineBlock from './pages/ClientMineBlock'
import CreateTransaction from './pages/CreateTransaction'
import DB from './DB';
import CreateBlockChain from './Blockchain/CreateBlockchain'
import Home from './pages/Home'
import sendData from './wrtconf/SendData'
import sendDataTo from './wrtconf/SendDataTo'
class App extends Component {
  state = {
    peerConns : [],
    db:new DB('blockchain'),
    longestChain:{lenChain:0},
    longestChainCandidates:[]
  }

  renderContent = () => {
    return(
      <div>
        <Route exact path = "/operations/mineBlock" component = {props =>
          <ClientMineBlock {...props} peerConns = {this.state.peerConns} />}>
        </Route>

        <Route exact path = "/operations/createTransaction" component = {props =>
          <CreateTransaction {...props} peerConns = {this.state.peerConns}
          newTx = {this.state.newTx}  />}>
        </Route>

        <Route exact path = "/operations/createBlockchain" component = {props =>
          <CreateBlockChain {...props} peerConns = {this.state.peerConns} 
          createdBlockChainHandler = {this.createdBlockChainHandler} />}>
        </Route>

        <Route exact path = "/home" component = {props =>
          <Home {...props} newTx = {this.state.newTx} block={this.state.block}          
          savedBlock={this.state.savedBlock}
          resultBroadcastUpdateMsg={this.state.resultBroadcastUpdateMsg}
          lastBlock = {this.state.lastBlock}
           />}>
        </Route>
      </div>
    )
  }  


  createdBlockChainHandler = createdBlockChain =>{
    this.setState({createdBlockChain})    
  }

  findPeerConn = (id) =>{
    console.log('peerConns: ', this.state.peerConns )
      let peerConn = null
      const peerConns = [...this.state.peerConns]
      for(let peerConnection of peerConns){
        if(peerConnection.id ===id){
          peerConn = peerConnection
          console.log('foundPeerConn: ',peerConn)
          break
        }
      }
      return peerConn
    }

  storeConnectionPeerHandler = data => {
    const {peerState,id,newConn} = data
    let dataPc = {'peerState':peerState, 'id':id , 'functionPc': newConn }
    let peerConns = [...this.state.peerConns]
    const verifIndex = peerConns.findIndex(peerConn => {
      return peerConn['id'] === id
    })
    if(verifIndex>= 0){
      peerConns[verifIndex] = {...dataPc}
      console.log('peerConn updated: ' , peerConns[verifIndex])
    }else{
      peerConns.push(dataPc)
      console.log('peerConn added')
    }
    this.setState({peerConns})
  }

  receiveDataIndex = data =>{    
    console.log('data received en app.js..', data)
    console.log('data.type: ', data.type)
    if(data.type==='pendingTx'){
      const {message,node_uuid,block,resultBroadcastUpdateMsg} = data
      const rend = {'message':message,'node_uuid':node_uuid}
      this.setState({newTx:rend,block,resultBroadcastUpdateMsg})

    }else if(data.type==='block'){
      const {message,node_uuid,newTx,resultBroadcastUpdateMsg,savedBlock} = data
      const rend = {'message':message,'node_uuid':node_uuid}
      this.setState({newTx,block:rend,resultBroadcastUpdateMsg,savedBlock})

    }else if(data.type === 'update'){
      new Promise((resolve,reject)=>{
        console.log('data received in update in app.js: ', data)
        resolve(sendData({'data':'','type':'update','peerConns':this.state.peerConns,'index':data.index}))
      }).then(response=>{
        if(response){
          this.setState({resultBroadcastUpdateMsg:response , block:null,newTx:null})
        }
      })
    }else if(data.type === 'lenChain'){//sending prepared block
      console.log(`preparing data to send...helping update another peer`)
      const {id,block, lenChain, node_uuid,type,peer_node_uuid} = data      
      const peerConn = this.findPeerConn(id)
      if(peerConn){
        new Promise((resolve,reject)=>{
          resolve(sendDataTo({'data':block,'lenChain':lenChain,'node_uuid':node_uuid,'type':type,
          'peerConn':peerConn,'peer_node_uuid':peer_node_uuid}))
         })
         .then(response=>{
          this.setState({resultBroadcastUpdateMsg:response})
         })
      }else{
        console.log('now peers available, peers were disconnected...')
      }
      
    }else if(data.type ==='updateTo'){//sending request to a node (to receive a block to update my chain)
      const {blockIndex,id,type,peer_node_uuid} = data
      const peerConn = this.findPeerConn(id)
      new Promise((resolve,reject)=>{
        resolve(sendDataTo({'blockIndex':blockIndex,'type':type,
        'peerConn':peerConn,'peer_node_uuid':peer_node_uuid}))
       })
       .then(response=>{
        this.setState({resultBroadcastUpdateMsg:response})
       })
    }else if(data.type==='showUpdatingProcessHandler'){
      console.log('receiving lastBlock: ', data.lastBlock)
      this.setState({lastBlock:data.lastBlock,block:null})
    }
  }

  lenLongestChainHandler = () =>{
    return this.state.longestChain.lenChain
  }

  updateLenLongestChainHandler = (longestChain) =>{
    console.log('updated longest chain: ', longestChain)
    this.setState({longestChain})
  }

  longestChainCandidatesHandler = ({lenChain,peer_node_uuid,status,socketId}) =>{
    const longestChainCandidates = [...this.state.longestChainCandidates]
    let found = false
    for(let longestChainCandidate of longestChainCandidates){
      if(longestChainCandidate['peer_node_uuid']===peer_node_uuid){
        longestChainCandidate['lenChain']=lenChain
        longestChainCandidate['status']=status
        longestChainCandidate['socketId']=socketId
        found = true
        break
      }
    }
    if(!found){
      longestChainCandidates.push({'peer_node_uuid':peer_node_uuid,'lenChain':lenChain,'status':status})
    }
    this.setState({longestChainCandidates})
  }

  requestAllowedCandidateHandler = data => {
    const peer_node_uuid = data
    let status = 'new'
    let longestChainCandidates = [...this.state.longestChainCandidates]
    let i = 0
    for(let longestChainCandidate of longestChainCandidates){
      i = longestChainCandidate['status']==='rejected' ? i+1:i
      if(longestChainCandidate['peer_node_uuid'] === peer_node_uuid){
        status = longestChainCandidate['status']
      }
    }
    if(longestChainCandidates.length>0 && i===longestChainCandidates.length){
      console.log('clearing all candidates of longest chain, because local chain does not match any of them')
      longestChainCandidates = []
      this.setState({longestChainCandidates})
      status = 'rejectedAll'//rejected,accepted,rejectedAll,new
    }
    return status
  }

  findNewLongestChainHandler = () => {
    let longestChainCandidates = [...this.state.longestChainCandidates]
    let lenChain = 0
    let peer_node_uuid = null
    let socketId = null
    //setup as that in newPeer component
    for(let longestChainCandidate of longestChainCandidates){
      if(longestChainCandidate['lenChain']>lenChain &&
      (longestChainCandidate['status']==='accepted'||longestChainCandidate['status'])==='new'){
        lenChain = longestChainCandidate['lenChain']
        peer_node_uuid = longestChainCandidate['peer_node_uuid']
        socketId = longestChainCandidate['socketId']
      }
    }
    let longestChain ={...this.state.longestChain}
    longestChain.lenChain = lenChain
    longestChain.peer_node_uuid = peer_node_uuid
    this.setState({longestChain})    
    return {'socketId':socketId,'peer_node_uuid':peer_node_uuid}
  }

  render() {
    return (
      <BrowserRouter>
        <div>
          <Mean newConnHandler = {this.storeConnectionPeerHandler}
          receiveDataIndex={this.receiveDataIndex}
          peerConns = {this.state.peerConns} createdBlockChain = {this.state.createdBlockChain}
          lenLongestChainHandler = {this.lenLongestChainHandler} 
          updateLenLongestChainHandler = {this.updateLenLongestChainHandler}
          longestChainCandidatesHandler= {this.longestChainCandidatesHandler}
          requestAllowedCandidateHandler = {this.requestAllowedCandidateHandler}
          findNewLongestChainHandler = {this.findNewLongestChainHandler} />          
          {this.renderContent()}
        </div>
      </BrowserRouter>
          
    )
  }
}

export default App
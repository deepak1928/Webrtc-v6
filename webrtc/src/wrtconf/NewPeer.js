import React , {Component} from 'react'
import PouchDB from 'pouchdb'
import Blockchain from '../Blockchain/Blockchain';
import DB from '../DB';
let icesReq = []
let socket = null
let peer_id = null
let rtcPeerConn = []
let sendDataChannel = []
let catchDataChannel = []
let ices = []
///////////////////////////////
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
//////////////////////////////

export default class NewPeer extends Component {    

    state = {
        fileBuffer : [],
        fileSize : []
    }

    will() {
        socket = this.props.socket
        peer_id = this.props.peer_id
        console.log("Entrando a component will mount...socket: ", this.props)
    }

    did() {
        socket.on('signaling_message',(data) => socket.emit('xyz',
        data,this.signalingMessageHandler))

        window.onbeforeunload = function() {
            socket.emit('signal',{"type":"endCall","message":"finishing call","peer_id":peer_id})
        };
    }

    callee = () => {
        this.will()
        this.did()
    }

    callAction = () => {
        console.log('socket:',this.props.socket)
        this.will()
        this.did()
        socket.emit('initSendCandidates',{message:"start","peer_id":peer_id})
        
        
        //sendFile.disabled = true
        console.log('Starting operation call.')
        //let i = null        
        new Promise((resolve,reject) => {
                //this.setState({i,rtcPeerConn,sendDataChannel,catchDataChannel})
                resolve(this.createPC())
                reject('error...')
            }).then(i =>{
                //console.log('state data after create: ' , this.state)
                console.log('data after createPC function: ',i)                
                console.log("i after createPc fcn",i)
                if(i>=0){
                    return new Promise((resolve,reject)=>{
                        resolve(this.setPC(i))
                        reject('Error on setPC...')
                    }).then(result => {
                        //displaySignalMessage('peerConnection createOffer start.')
                        //let [rtcPeerConn,sendDataChannel] = result
                        console.log('peerConnection createOffer start.')
                        rtcPeerConn[i].createOffer()
                        .then(e => this.createdOffer(e,i)).catch(this.setSessionDescriptionError)
                    })
                }else{
                    return new Promise((resolve,reject)=>{                        
                        reject('Error on nowhere...')
                    })

                }
            }).then(result =>{    
                //let [rtcPeerConn,sendDataChannel] = result
                console.log(result)

            }).catch(e=>console.log(e))       
        
    }

    createPC = () => {
        //let {rtcPeerConn,sendDataChannel,catchDataChannel} = this.state
        //let rtcPeerConn1 = [...this.state.rtcPeerConn]        
        //let sendDataChannel1 = [...this.state.sendDataChannel]
        //let catchDataChannel1 = [...this.state.catchDataChannel]
        console.log("rtcPeerConn1: ",rtcPeerConn)
        const i = rtcPeerConn.length        
        const initiator = null
        rtcPeerConn.push(initiator)
        sendDataChannel.push(initiator)
        catchDataChannel.push(initiator)

        return i
    }

    setPC = (i) => {
        //let [i,rtcPeerConn,sendDataChannel,catchDataChannel] = [...result]
        //let {i,rtcPeerConn,sendDataChannel,catchDataChannel} = this.state
        const servers = {
            'iceServers':[//{
                //'url':'stun:stun.l.google.com:19302'
            //},{'url': 'stun:stun.services.mozilla.com'}
            {'urls':'turn:kaydee@159.65.151.221','credential':'userdeepak','username':'kaydee'}
        ]
        }
        const dataChannelOptions = {
            ordered: true//false, //not guaranteed delivery, unreliable but faster
            //maxRetransmitTime:  1000 //miliseconds
        }
        //callButton.disabled = true;
        //hangupButton.disabled = false;
        console.log(`Received data in setPC:rtcPeerConn[${i}]-> ${rtcPeerConn[i]}`)
        rtcPeerConn[i] = new window.RTCPeerConnection(servers)//new window.webkitRTCPeerConnection(servers)
        console.log('Created local peer connection object rtcPeerConn index: ' + i )
        const name = 'textMessages' + i
        sendDataChannel[i] = rtcPeerConn[i].createDataChannel(name,dataChannelOptions)    
        rtcPeerConn[i].ondatachannel = e=>this.receiveDataChannel(e,i)
        rtcPeerConn[i].addEventListener('icecandidate', this.handleConnection)
        rtcPeerConn[i].addEventListener(
        'iceconnectionstatechange', this.handleConnectionChange)

        return [rtcPeerConn,sendDataChannel]
    }
    
    
    receiveDataChannel = (event,i)=>{
        console.log("Receiving a data channel")
        catchDataChannel[i] = event.channel;//seteando el canal de datos a ser el que el   
        catchDataChannel[i].onmessage = e=>this.receiveDataChannelMessage(e,i);
        catchDataChannel[i].onopen = e=>this.dataChannelStateChanged(e,i,catchDataChannel);
        catchDataChannel[i].onclose = e => this.dataChannelStateChanged(e,i,catchDataChannel);
        //return catchDataChannel;
        //this.setState({catchDataChannel})
    }
    
    receiveDataChannelMessage = async (event) => {
        console.log('Message received: ' , event.data)
        let received = JSON.parse(event.data)
        const {type,message,node_uuid} = received
        /////////////////////////////////////////////////////////////////////        
        const blockchain = new Blockchain()
        const db = new DB('blockchain')
        if(type==='pendingTx'){
        new Promise((resolve,reject)=>{
            resolve(db.saveData({'newTx':message}))
            //reject(console.log('Error can not save transacction'))
        }).then(showTx=>{
            console.log('result desde DB showtx? :', showTx )
            if(showTx){
                this.props.receiveData({'node_uuid': node_uuid,
                'type': type,'message':message,'block':null,'resultBroadcastUpdateMsg':null})           
            }
        })
        }else if(type === 'block'){
            this.props.receiveData({'node_uuid': node_uuid,
                'type': type,'message':message,'savedBlock':false,'newTx':null,
                'resultBroadcastUpdateMsg':null})

            new Promise((resolve,reject)=>{
                resolve(blockchain.processIncomingBlock(message))
                reject('something went wrong')
            }).then(({updateExistingChain , updateChain , receivedChain})=>{
                if(updateExistingChain){
                    console.log('UpdateExistingChain',updateExistingChain)
                    this.props.updateLenLongestChainHandler({'lenChain':0,
                    'peer_node_uuid':''})
                    //trying to update existing block
                    new Promise((resolve)=>{
                        resolve(blockchain.getLastBlock())                        
                    }).then(lastBlock=>{
                        console.log('last Block obtained in new peer.js,' , lastBlock)
                        if(lastBlock){
                            let idx = lastBlock.index + 1
                            this.props.receiveData({'type':'update','index':idx.toString()})
                        }
                    })
                }
                else if(receivedChain){
                    this.props.receiveData({'node_uuid': node_uuid,
                    'type': type,'message':message,'savedBlock':true,'newTx':null,
                    'resultBroadcastUpdateMsg':null})
                }else if(updateChain){
                    this.props.receiveData({'type':'update','index':'1'})//requesting first block 
                    //of al other nodes connected with me
                }
            })

        }else if(type === 'update'){//receiving a request from another peer
            let lastBlock = null
            new Promise((resolve,reject)=>{
                resolve(blockchain.getLastBlock())
            })
            .then(response => {
                lastBlock = response
                if(lastBlock){
                    new Promise((resolve)=>{
                        resolve(blockchain.getBlock(received.index))
                    }).then(response=>{
                        console.log(`block number ${received.index} extracted from pouch is: `, response)
                        let block = response
                        this.props.receiveData({'type':'lenChain','lenChain':lastBlock.index,
                        'block':block,'node_uuid':this.props.node_uuid,'id':socket.id,
                        'peer_node_uuid':received.node_uuid})
                    })                    
                }
            })
        }
        else if(type === 'lenChain'){//receiving a block to update my local chain
            console.log('receiving a block to update my local chain: ',received)
            const {lenChain ,node_uuid} = received
            const block = received.message
            let status = this.props.requestAllowedCandidateHandler(node_uuid)
            let lenLongestChain =  this.props.lenLongestChainHandler()
            //if receive a new longest => save the length
            if(lenLongestChain < lenChain){
                lenLongestChain = lenChain
                this.props.updateLenLongestChainHandler({'lenChain':lenLongestChain,
                'peer_node_uuid':node_uuid})
            }
            console.log('status: ', status)
            if((status === 'new' || status === 'accepted' || status==='retested') && 
            lenChain === lenLongestChain){
                console.log('received block from another peer: ',block)
                if(block.index===1 && status==='retested'){
                    //receiving first retested block and deleting existing database
                    new Promise((resolve)=>{
                        resolve(new PouchDB('blockchain').destroy())
                    })
                    .then( (res) => {
                        console.log('response after destroying whole database: ', res)
                        const save_node_uuid = new Promise((resolve)=>{                            
                            resolve(new DB('blockchain').saveUUID(this.props.node_uuid))
                        })
                        .then(r=>{
                            console.log('saved node_uuid in pouch?: ',r)
                            return r
                        })
                        return save_node_uuid
                    })
                    .then(r=>{
                        console.log('r: ',r)
                        if(r){
                        console.log('r: ',r)
                        const blockchain = new Blockchain()
                        this.processEntrance(blockchain,lenChain,node_uuid,block,status)
                        }
                    })
                    .catch((err) => {
                        console.log('Error triying to save node_uuid: ', err)
                        return null
                    })
                }else{
                    this.processEntrance(blockchain,lenChain,node_uuid,block,status)
                }

            }else if(status==='rejected'){
                console.log('incoming block was rejected: ' , block)
            }else if(status==='rejectedAll'){
                this.props.receiveData({'type':'update','index':'1'})
            }
            
        }else if(type === 'updateTo'){//receiving a request from another peer
            let {blockIndex} = received
            let lastBlock = null
            new Promise((resolve,reject)=>{
                resolve(blockchain.getLastBlock())
            })
            .then(response => {
                lastBlock = response
                if(lastBlock){
                    let block = new Promise((resolve)=>{
                        resolve(blockchain.getBlock(blockIndex.toString()))
                    }).then(response=>{
                        let block = response
                        this.props.receiveData({'type':'lenChain','lenChain':lastBlock.index,
                        'block':block,'node_uuid':this.props.node_uuid,'id':socket.id})
                    })
                    return block
                }
            })
        }
        /////////////////////////////////////////////////////////////////////
        //this.props.receiveData({'node_uuid': node_uuid,'type': type,'message': message,'socketId':socket.id})
    }



    processEntrance =  async (blockchain,lenChain,node_uuid,block,status) => {
        let lenLongestChain =  this.props.lenLongestChainHandler()
        const lenMyChain = await new Promise((resolve,reject)=>{
            resolve(blockchain.getLastBlock())
        }).then(r=>{
            let result = 0
            if(r!==null){
                result = r.index
            }
            return result
        })        
        
        //only receiving chain from another peers which legth chain is greater than my chain.
        if(lenMyChain<lenChain){
            new Promise((resolve,reject)=>{
                resolve(blockchain.processIncomingBlock(block))//saving block
            }).then(response=>{
                console.log('response after processing block: ',response)
                let lastBlock = null
                lastBlock = new Promise((resolve,reject)=>{
                    resolve(blockchain.getLastBlock())
                }).then(r=>{return r})
                return lastBlock
                /*
                if(response.receivedChain){
                    lastBlock = new Promise((resolve,reject)=>{
                        resolve(blockchain.getLastBlock())
                    }).then(r=>{return r})
                    return lastBlock
                }else{
                    console.log('Error block not accepted ...')                    
                    return lastBlock//return null
                }*/
            }).then(lastBlock => {//sending request for next block...
                if(lastBlock){
                    console.log('lastBlock.index%5===0?', lastBlock.index%5===0)
                    if(lastBlock.index%5===0){
                        console.log('lastBlock: ', lastBlock)
                        console.log('rest of lastBlock.index%5:',lastBlock.index%5)
                        
                        this.props.updateLastBlockHandler(lastBlock)
                        this.props.receiveData({'type':'showUpdatingProcessHandler',
                        'lastBlock':lastBlock})
                    }
                    if(lastBlock.index<lenLongestChain){
                        console.log('lastBlock stored: ', lastBlock,'incoming block: ', block)
                        if(lastBlock.hash === block.hash){///making sure incoming block was stored
                            console.log('last block just saved match with incoming block!!')
                            this.props.receiveData({'type':'updateTo','blockIndex':lastBlock.index+1,
                            'id':socket.id,'peer_node_uuid':node_uuid})
                            this.props.longestChainCandidatesHandler({'lenChain':lenChain,
                            'peer_node_uuid':node_uuid,'status':'accepted','socketId':socket.id})
                        }else if(lastBlock.index + 1 === block.index){//are equal but not imply hashes are same
                            //block was not saved
                            //make sure is the longest
                            if(lenLongestChain === lenChain && (status === 'accepted' || status ==='new')){
                                this.props.longestChainCandidatesHandler({'lenChain':lenChain,
                                'peer_node_uuid':node_uuid,'status':'retested','socketId':socket.id})
                                //this.props.receiveData({'type':'update','index':'1'})//updating whole chain
                                this.props.receiveData({'type':'updateTo','blockIndex':'1',
                                'id':socket.id,'peer_node_uuid':node_uuid})
                                
                            }else if(lenLongestChain === lenChain && status === 'retested'){
                                this.props.longestChainCandidatesHandler({'lenChain':lenChain,
                                'peer_node_uuid':node_uuid,'status':'rejected','socketId':socket.id})
                                //update longestchain
                                this.props.updateLenLongestChainHandler({'lenChain':0,
                                'peer_node_uuid':node_uuid})
                                //try with another node_uuid
                                const {socketId, peer_node_uuid} =this.props.findNewLongestChainHandler()
                                if(socketId && peer_node_uuid){
                                    console.log('Peer available to update chain: ',
                                    'socketId: ',socketId, 'peer_node_uuid: ',peer_node_uuid)
                                    this.props.receiveData({'type':'updateTo','blockIndex':'1',
                                    'id':socketId,'peer_node_uuid':peer_node_uuid})
                                }else{
                                    console.log('No other peers available to update chain: ',
                                    'socketId: ',socketId, 'peer_node_uuid: ',peer_node_uuid)
                                }
                            }
                        }
                    }else if(lastBlock.index===lenLongestChain){
                        console.log(`All done, chain updated...`)
                        this.props.updateLastBlockHandler(lastBlock)
                        this.props.receiveData({'type':'showUpdatingProcessHandler',
                        'lastBlock':lastBlock})
                    }
                }
            })
        }

    }


    dataChannelStateChanged = (e,i,catchDataChannel) => {
        if(catchDataChannel[i]!==null){
            if(catchDataChannel[i].readyState === 'open'){//si el readyState es abierto
                //displaySignalMessage("Data Channel Opened")
                console.log("Data Channel Opened")
            }else{
                //displaySignalMessage("data channel is : " + catchDataChannel[i].readyState)
                console.log("data channel is : " + catchDataChannel[i].readyState)
            }
            //this.props.showState({'catchDataCannelState':catchDataChannel[i].readyState})
        }
    }

    handleConnection = event => {
        const iceCandidate = event.candidate;
        if(iceCandidate){
            //console.log('state data after create.....: ' , this.state)
            //let icesReq = [...this.state.icesReq]
            icesReq.push(iceCandidate)
            //this.setState({icesReq})
        }
        //else if (!iceCandidate && this.state.icesReq.length>0) {
        else if (!iceCandidate && icesReq.length>0) {           
            console.log("icesReq: ",icesReq)
            //const {socket} = this.props
            //let len = this.state.icesReq.length
            let len = icesReq.length
            let iter = 0
            //displaySignalMessage("ICE protocol gathered " + len + " candidates.." )
            console.log("ICE protocol gathered " + len + " candidates..")
            let newIceCandidate
            //let icesReq = [...this.state.icesReq]
            icesReq.forEach(iceCandidate=>{
                iter++
                newIceCandidate = iceCandidate
                console.log("candidate created ready to be sent: ", newIceCandidate)
                socket.emit('signal',{
                    "type":"ice candidate",
                    "message":JSON.stringify({'candidate':newIceCandidate}),
                    //"room":SIGNAL_ROOM
                    "peer_id":peer_id
                })
                //displaySignalMessage( iter +". Sending Ice candidate ...");
                console.log(`${iter} . Sending Ice candidate al peer ${peer_id}`)
            })
            socket.emit('signal',{
                "type":"noIce",
                "message":"",
                //"room":SIGNAL_ROOM})
                "peer_id":peer_id
            })
                console.log(`ending noIce signal to peer ${peer_id}`)
            //icesReq = []
        }//else if(!iceCandidate && this.state.icesReq.length==0){
            else if(!iceCandidate && icesReq.length===0){
            //displaySignalMessage("Candidate received is null, no candidates received yet, check your code!..")
            console.log("Candidate received is null, no candidates received yet, check your code!..")
        }
    }

    setSessionDescriptionError = (error) => {
        //displaySignalMessage(`Failed to create session description: ${error.toString()}.`);
        console.log(`Failed to create session description: ${error.toString()}.`);
    }

    handleConnectionChange = (event) => {
        const peerConnection = event.target;
        console.log('ICE state change event: ', event);
        if(peerConnection.iceConnectionState === "connected"); //sendFile.disabled = false;
        //displaySignalMessage(`ICE state: ` +
        //        `${peerConnection.iceConnectionState}.`);
        console.log(`ICE state: ` +
                `${peerConnection.iceConnectionState}.`)
        this.props.showState({'peerState':peerConnection.iceConnectionState,'socketId':socket.id})
    }
    
    createdOffer = (description , i) => {
        console.log('offer from this local peer connection: ',description.sdp)
        //displaySignalMessage('localPeerConnection setLocalDescription start.');
        console.log('localPeerConnection setLocalDescription start.');
        rtcPeerConn[i].setLocalDescription(description)
        .then(() => {
        this.setLocalDescriptionSuccess(i);
        console.log('Local description created: ',rtcPeerConn[i].localDescription)
        //displaySignalMessage("Local description created..")
        console.log("Local description created..")
        this.sendLocalDesc(rtcPeerConn[i].localDescription)
        }).catch(this.setSessionDescriptionError);
    }

    setLocalDescriptionSuccess = (i) => {
        this.setDescriptionSuccess(`setLocalDescription number ${i}`);
    }

    setDescriptionSuccess = (functionName) => {
        //displaySignalMessage(`${functionName} complete.`);
        console.log(`${functionName} complete.`)
    }

    sendLocalDesc = (desc) => {
        //const {socket} = this.props
        console.log("sending local description",desc)
        try{
            //displaySignalMessage("16. Sending Local description");
            console.log("16. Sending Local description")
            var sdp = {
                type:"SDP",
                message:JSON.stringify({'sdp':desc}),              
                //room:SIGNAL_ROOM
                peer_id:peer_id
            }
            console.log("sdp sent to other nodes in sendLocalDescription: ",sdp)
            socket.emit('signal',sdp);
        }catch(e){
            this.logError1(e,"sending local description");
        }
    }

    setSessionDescriptionError = error => {
        //displaySignalMessage(`Failed to create session description: ${error.toString()}.`);
        console.log(`Failed to create session description: ${error.toString()}.`);
    }

    logError1 = (error,where) => {
        //displaySignalMessage("problems in " + where +" "+ error.name + ': ' + error.message );
        console.log("problems in " + where +" "+ error.name + ': ' + error.message )
    }

    determineI = () => {
        let i = 0    
        return i
    }

    signalingMessageHandler = async (data)=>{
        console.log('data recibida en signalingMessageHandler ',data)
        let i = this.determineI()
        console.log("data",data)
        //displaySignalMessage("data type: " + data.type)
        if (!rtcPeerConn[i]) this.setPC(i);
        try {
            if (data.type==="SDP") {
                var a = JSON.parse(data.message)
                var desc = a.sdp
                console.log("desc: ",desc)
                var c = desc.type          
                //displaySignalMessage('working on sdp type ' + c)
                console.log('working on sdp type ' + c)
                // if we get an offer, we need to reply with an answer
                if (c === 'offer') {
                    //displaySignalMessage("Entering to define an answer because of offer input..")
                    console.log("Entering to define an answer because of offer input..")
                    await rtcPeerConn[i].setRemoteDescription(desc).then(r=>{
                        //displaySignalMessage("Remote description stored")
                        console.log("Remote description stored")
                    }).catch(e=>{
                        //displaySignalMessage('error setting remote description ' + e.name)
                        console.log("Error setting remote description: ", e)
                    });
                    await rtcPeerConn[i].setLocalDescription(await rtcPeerConn[i].createAnswer()).then(r=>{
                        //displaySignalMessage("Created Local description")
                        console.log("Created Local description")
                    }).catch(e=>{
                        //displaySignalMessage("Error setting local description when receiving an offer: " + 
                        //e.name)
                        console.log("Error setting local description when receiving an offer: " + e.name)
                    });
                    console.log('local description-answer: ',rtcPeerConn[i].localDescription)
                    this.sendLocalDesc(rtcPeerConn[i].localDescription)
                } else if (c === 'answer') {
                    //displaySignalMessage("Entering to store the answer remote description..")
                    console.log("Entering to store the answer remote description..")
                    await rtcPeerConn[i].setRemoteDescription(desc).then(r=>{
                        //displaySignalMessage("Remote answer stored")
                        console.log("Remote answer stored :",rtcPeerConn[i].remoteDescription)                            
                    }).catch(e=>{
                    //displaySignalMessage('error setting remote descrition: '+ e.name)
                    console.log('error setting remote descrition: ', e)
                    });                     
                } else {
                    console.log('Unsupported SDP type.');
                }
            } else if (data.type === "ice candidate") {
                //displaySignalMessage("Adding foreign Ice candidate..")
                console.log("Adding foreign Ice candidate..")
                var m = JSON.parse(data.message)
                const ice = m.candidate
                console.log('ice candidate: ',ice)                
                ices.push(ice)
            } else if(ices.length>0 && data.type ==="noIce"){                    
                    ices.forEach(ice=>{
                        rtcPeerConn[i].addIceCandidate(ice).then(r=>{
                            //displaySignalMessage('added a foreign candidate')
                            console.log('added a foreign candidate')
                        }).catch(e => {
                        //displaySignalMessage("3. Failure during addIceCandidate(): " + e.name)
                        console.log('error adding iceCandidate: ', e)
                        })
                    })
                }
            else if(data.type ==="endCall"){
                rtcPeerConn[i].close()
                if(sendDataChannel[i]){
                    sendDataChannel[i].close()
                    sendDataChannel[i] = null
                }
                if(catchDataChannel[i]){
                    catchDataChannel[i].close()
                    catchDataChannel[i] = null
                }
                rtcPeerConn[i] = null;
                //sendFile.disabled = true
                icesReq = []
                //hangupButton.disabled = true;
                //callButton.disabled = false;
            }
        } catch (err) {
            //displaySignalMessage("error on signaling message: " + err.name);
            console.log("error on signaling message: " , err)
        }
    }

    sendFileFcn = (data) => {
        console.log('sending data...')
        window.setTimeout(()=>{
            sendDataChannel[0].send(data)
        },1000)
    }

    render() {
        
        return(
            <div>
                <button onClick = {this.callAction}>start Call</button>                
            </div>
        )
    }
}
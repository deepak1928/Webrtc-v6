const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socketIO = require('socket.io')
//const io = socketIO(server)
const io = socketIO.listen(server)
let ids = []
let nodes_uuid = []
const port = 4001
let general_ids = []
//let node_handler=[];
//let node_disc_handler=[];
verify = (arr , searched_value) => {
  return arr.findIndex(el=>{
    return el === searched_value
  })
}


assigner = (idx , offset , len , socket ) =>{
  const socketId = socket.id
  const a = !(typeof(general_ids[idx+offset])==='undefined' || general_ids[idx+offset]===null)
  let foundIndex = null
  let alreadyConnected = false
  if(a){
    for(let i=0;i<4;i++){
      const b = general_ids[idx+offset]['sockets'][i]['numberNodeConnection']===len
      if(b){
        alreadyConnected = true                 
        break
      }
    }

    if(!alreadyConnected){          
      for(let i=0;i<4;i++){
        const b = general_ids[idx+offset]['sockets'][i]['numberNodeConnection']===len
        if(!b){
          foundIndex = i
          break
        }
      }
    }

    if(foundIndex !== null){
      let i = foundIndex
      console.log('socket found is: ', general_ids[idx+offset]['sockets'][i])
      const candidate = general_ids[idx+offset]['sockets'][i]['socket']
      general_ids[idx+offset]['sockets'][i]['state'] = 1
      general_ids[idx+offset]['sockets'][i]['numberNodeConnection'] = len
      general_ids[idx+offset]['sockets'][i]['peer_id']=socketId

      let k = general_ids[idx]['sockets'].findIndex(dataSocket =>{
        return dataSocket.socket === socketId
      })
      console.log('index k of new socket is: ' , k , 'in the array' , general_ids[idx]['sockets'] )

      general_ids[idx]['sockets'][k]['state']=1
      general_ids[idx]['sockets'][k]['numberNodeConnection']= len + offset
      general_ids[idx]['sockets'][k]['peer_id']=general_ids[idx+offset]['sockets'][i]['socket']
      console.log('updated general_ids in len =', len)
      socket.emit('newCandidate',{candidate_socket_id: candidate , socket:socketId})
    }
  }
}

io.on('connection', socket => {
  console.log('New socket connected')
  
  socket.on('searchingPeer',({id , node_uuid })=>{
    //let candidate = null
    console.log("id: ", id , "node_uuid: " , node_uuid )
    const verifIndex = verify(nodes_uuid,node_uuid) //searching if new uuid exists
    
    const null_restriction = verify(nodes_uuid,null)//searching where to put him

    let newSocket = {'socket': id , state: 0}

    let idx = null

    ///////////cases
    //1.

    if(null_restriction>=0 && verifIndex==-1){ //case when there is an available position where 
      //to add a New node
      console.log(`The new node will be added in the index position ${null_restriction}
       abandoned bay another peer`)
      nodes_uuid[null_restriction] = node_uuid
      ids[null_restriction]=id
      let obj = {'node_uuid':node_uuid , 'sockets':[newSocket] }
      general_ids[null_restriction] = obj
      idx = null_restriction

    }
    //2.
    if( verifIndex>=0){ //case when the node_uuid is registered and I want to add a new socket
      // of that node
      let uuid_socket = general_ids[verifIndex] 
      //verifiying the node_uuid is in the array that contains node:uuid and sockets
      if(uuid_socket['node_uuid'] === node_uuid  ){ //extra verification to make sure node_uuid 
        //is registered
        let sockets = uuid_socket['sockets']//return an array        
        sockets.push(newSocket) //adding the new socket to the corresponding uuid
        uuid_socket['sockets'] = sockets
        console.log('updated object: ', uuid_socket)
        idx = verifIndex
      }else{
        console.log('Error, node_uuid partially not registered... check the code')
      }
    }else if( null_restriction ==-1 && verifIndex==-1 ){//3. if there are no null positions and
      //the node is new
      nodes_uuid.push(node_uuid)
      let obj = {'node_uuid':node_uuid , 'sockets':[newSocket] }
      general_ids.push(obj)
      console.log('New node uuid added: ', nodes_uuid )
       idx = nodes_uuid.length - 1
    }
    console.log('incoming node index position is ' , idx )
    console.log('node_handler_list:',nodes_uuid)
    console.log('node to check:',node_uuid)
    let len = idx + 1   
    if(len%6 === 1 ){
      if(len ===1){
        const offset = 1        
        assigner(idx , offset , len , socket)
      }else{
        /////////////////////////////////////PENDING
      }
    }
    else if(len%6 === 0 && len>0){
      if(len===6){
        assigner(idx , -5 , len , socket )
        assigner(idx , -1 , len , socket )
        assigner(idx , +6 , len , socket )        
      }else{
        assigner(idx , -6 , len , socket )
        assigner(idx , -5 , len , socket )
        assigner(idx , -1 , len , socket )
        assigner(idx , +6 , len , socket )     
      }
    }
    else{
      if(len ===2 || len ===3 || len ===4 || len ===5){
        ///////////////////////////////////////////////        
        //assigner(idx , offset , len , socket )
        assigner(idx , -1 , len , socket )
        assigner(idx , +1 , len , socket )
        assigner(idx , +6 , len , socket )
        ///////////////////////////////////////////////
      }else{//not tested
        assigner(idx , -6 , len , socket )
        assigner(idx , -1 , len , socket )
        assigner(idx , +1 , len , socket )
        assigner(idx , +6 , len , socket )
      }
    }
  })

  socket.on('initSendCandidates',data =>{
    const {peer_id} = data
    console.log(`Telling socket ${peer_id} callee be prepared...`)
    socket.broadcast.to(peer_id).emit('startCallee',{candidate_socket_id: socket.id , socket:peer_id})
  })

  socket.on('signal',({type,message,peer_id}) =>{
    //const peer_id_socket_index = verify(ids,socket.id)
    //const peer_id_socket = ids[peer_id_socket_index]
    console.log('message receive in signal: ', {type,message,peer_id} )    
    socket.broadcast.to(peer_id).emit('signaling_message',{
      type:type,
      message:message
      //candidate_socket_id: socket.id
    })
  })

  socket.on('xyz',(data,callback)=>{
    callback(data)
  })

  // disconnect is fired when a client leaves the server
  socket.on('disconnect', () => {
    
    console.log('++++++++++++++++++++++++++++++++++++++++++++')
    console.log('user disconnected: ', socket.id);
    console.log('++++++++++++++++++++++++++++++++++++++++++++')   

    let handle = null
    if(general_ids.length>0){
      for(let m =0; m<general_ids.length;m++){
        if(general_ids[m]!==null){
          for(let dataSocket of general_ids[m]['sockets']){          
            if(dataSocket.socket == socket.id){
              handle = m
              break
            }
          }
          if(handle!==null) break;
        }
      }
    }

    console.log('handle: ' , handle)
    if(handle>=0 && handle!==null){
      if(handle === general_ids.length-1 ){        
        general_ids.splice(handle,1)
        nodes_uuid.splice(handle,1)
      }else{
        general_ids[handle] = null
        nodes_uuid[handle]=null
      }
      console.log('Clearing socket from general_ids: ',general_ids)
      console.log('clearing node_uuid', nodes_uuid)
    }  

    for(let i=0;i< general_ids.length;i++){
      if(general_ids[i]!=null){
        for(let j=0;j<4;j++){
          if(general_ids[i]['sockets'][j]['peer_id']==socket.id){
            general_ids[i]['sockets'][j]['state']=0
            general_ids[i]['sockets'][j]['numberNodeConnection']=null
            general_ids[i]['sockets'][j]['peer_id']=null
            console.log(`general_ids[${i}]['sockets'][socket]: 
              ${general_ids[i]['sockets'][j]}`)
          }
        }
      }
    }
    //console.log("final ids", ids)
    console.log("final nodes_uuids",nodes_uuid)
    console.log('final general_uuid: ', general_ids )      
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))
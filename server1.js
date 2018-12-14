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
let node_handler=[];
let node_disc_handler=[];
verify = (arr , searched_value) => {
  return arr.findIndex(el=>{
    return el === searched_value
  })
}

socket_idx= function(sockets){
    let i=0;
    for (i=0;i<4;i++){
      console.log('socket data:',sockets)
      if(sockets[i]['state']==0){
        var k={
          "index":i,
          "paired_socket_id":sockets[i]['socket']
        }
        return k;
      }
    }
  return -1;  
}

socket_index=function(ids,id){
  let i=0
  console.log(ids)
  while(i< ids.length){
    console.log('value of i: ',i)
    console.log(ids[i]['id'])
    if(ids[i]['id']==id){
      var k={
        "index":ids[i]['index'],
        "node_uuid":ids[i]['node_uuid']
      } 
      return k;
    }
    i++
  }
  return -1;
}

io.on('connection', socket => {
  console.log('New socket connected')
  
  socket.on('searchingPeer',({id , node_uuid })=>{
    let candidates = {}
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
      //ids[null_restriction]=id
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
    console.log('index where the incoming node position is ' , idx )
     
    /////
      //LOGIC GOES HERE' 
       
      var l_id={
          "index":idx,
          "id":socket.id,
          "node_uuid":node_uuid,
          "paired_socket_id":null
  
      }

      ids.push(l_id)
      console.log('node_handler_list:',node_handler)
      console.log('node to check:',node_uuid)
      
      var handle= verify(node_handler,node_uuid)
      if (handle ==-1)
      { 
        
        if(idx==0 && nodes_uuid.length>1){
           let sockets=[]
           k=socket_idx(general_ids[idx+1]['sockets'])
           i=k['index']
           var c=0
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==id){
              ids[c]['paired_socket_id']=k['paired_socket_id']
            }
          }
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==k['paired_socket_id']){
              ids[c]['paired_socket_id']=id
            }
          }

          sockets.push(general_ids[idx+1]['sockets'][i]['socket']);
          candidates["sockets"]=sockets; 
              
          general_ids[idx]['sockets'][0]['state']=1;
          general_ids[idx+1]['sockets'][i]['state']=1;
        }
        else if (idx >0 && idx <5)
        {
          let sockets=[]
          console.log('socket to check:',general_ids[idx-1]['sockets']);
          k=socket_idx(general_ids[idx-1]['sockets'])   
          console.log('value of k is: ',k)   
          i=k['index']
          var c=0
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==id){
              ids[c]['paired_socket_id']=k['paired_socket_id']
            }
          }
           
          
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==k['paired_socket_id']){
              ids[c]['paired_socket_id']=id
            }
          }//ids[idx-1]['paired_socket_id']=id????
          console.log('value of i is:',i);
          sockets.push(general_ids[idx-1]['sockets'][i]['socket']);
          candidates["sockets"]=sockets; 
          console.log(general_ids)    
          general_ids[idx]['sockets'][0]['state']=1;
          general_ids[idx-1]['sockets'][i]['state']=1;
          // normal push
          // normal push
        }
        else if((idx%6)===5)
          {
            let sockets=[]
            // normal push + we have to connect this node with (idx-5)th node
            //means 5th, 11th, 17th node has to be pushed to 4th,10th, and 16th as well as idx-5 i.e 
            // 0 , 6th ,12th node.
            k=socket_idx(general_ids[idx-1]['sockets'])
            i=k['index']
            sockets.push(general_ids[idx-1]['sockets'][i]['socket']);
            for(c=0;c< ids.length;c++){
              if(ids[c]['id']==id){
                ids[c]['paired_socket_id']=k['paired_socket_id']
              }
            }
             
            
            for(c=0;c< ids.length;c++){
              if(ids[c]['id']==k['paired_socket_id']){
                ids[c]['paired_socket_id']=id
              }
            }
            k=socket_idx(general_ids[idx-5]['sockets'])
            j=k['index']
            for(c=0;c< ids.length;c++){
              if(ids[c]['id']==id){
                ids[c]['paired_socket_id']=k['paired_socket_id']
              }
            }
             
            
            for(c=0;c< ids.length;c++){
              if(ids[c]['id']==k['paired_socket_id']){
                ids[c]['paired_socket_id']=id
              }
            }
            sockets.push(general_ids[idx-5]['sockets'][j]['socket']);
            candidates["sockets"]=sockets; 
            general_ids[idx-1]['sockets'][i]['state']=1; 
            general_ids[idx]['sockets'][0]['state']=1;
            general_ids[idx-5]['sockets'][j]['state']=1;

            general_ids[idx]['sockets'][1]['state']=1;
            }
        else if((idx > 5) && ((idx%6) == 0))
          {
            let sockets=[]
            k=socket_idx(general_ids[idx-6]['sockets'])
            i=k['index']
            for(c=0;c< ids.length;c++){
              if(ids[c]['id']==id){
                ids[c]['paired_socket_id']=k['paired_socket_id']
              }
            }
             
            
            for(c=0;c< ids.length;c++){
              if(ids[c]['id']==k['paired_socket_id']){
                ids[c]['paired_socket_id']=id
              }
            }
            sockets.push(general_ids[idx-6]['sockets'][i]['socket']);
            candidates["sockets"]=sockets;
            general_ids[idx-6]['sockets'][i]['state']=1;

            general_ids[idx]['sockets'][0]['state']=1;
            
            
            
          }
            // we have to connect this node to (idx-6)th node means 7th node will
          // connect to 1st node 
      
      else if(idx>5)
        {
          let sockets=[]
          k=socket_idx(general_ids[idx-1]['sockets'])
          i=k['index']
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==id){
              ids[c]['paired_socket_id']=k['paired_socket_id']
            }
          }
           
          
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==k['paired_socket_id']){
              ids[c]['paired_socket_id']=id
            }
          }
          sockets.push(general_ids[idx-1]['sockets'][i]['socket']) ;
          k=socket_idx(general_ids[idx-6]['sockets'])
          j=k['index']

          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==id){
              ids[c]['paired_socket_id']=k['paired_socket_id']
            }
          }
           
          
          for(c=0;c< ids.length;c++){
            if(ids[c]['id']==k['paired_socket_id']){
              ids[c]['paired_socket_id']=id
            }
          }
          sockets.push(general_ids[idx-6]['sockets'][j]['socket']) ;
          candidates["sockets"]=sockets;
          general_ids[idx-1]['sockets'][i]['state']=1;
           
          general_ids[idx]['sockets'][0]['state']=1;
          general_ids[idx-6]['sockets'][j]['state']=1;
          
          general_ids[idx]['sockets'][1]['state']=1;  
          // we have to connect this node to (idx-6)th node as well as (idx-1)th node
          //means 8th node will get connected to 7th node and (idx-6) i.e 8-6=2 which is 2nd node.
          }
          node_handler.push(node_uuid);
        }
      ///////////////////////////////////////////////      
      //ids = [...r_ids,newId]//Object.assign({},r_ids,newId)//{...r_ids,newId}      
      if(Object.keys(candidates).length>0){
        console.log("candidate to send in searching peer: ", candidates['sockets'][0])
        //socket.emit('newCandidate',candidates)
        socket.emit('newCandidate',{candidate_socket_id: candidates['sockets'][0] , socket:socket.id})     
    }else{

      console.log("first node registered", node_uuid )
    }

    for(i=0;i< node_disc_handler.length;i++){
      if(node_disc_handler[i]==node_uuid){
        node_disc_handler.splice(i,1)
      }
    }
      console.log("list of all nodes_uuid: ",nodes_uuid)
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
    console.log('list of Socket IDs:',ids)
    var socket_details=socket_index(ids,socket.id)
    var indx=socket_details['index']
    var node_uuid=socket_details['node_uuid']
    
    var handle= verify(node_disc_handler,node_uuid)
    
    for(i=0;i<ids.length;i++){
      if(ids[i]['id']==socket.id){
        console.log(ids[i])
        var pair=ids[i]['paired_socket_id']
        var index= ids[i]['index']

        console.log('pair',pair, ' and index:',index)
        for(j=0;j< general_ids.length;j++){
          if(general_ids[j]!=null ){
          
          
            console.log(general_ids[j])
            for(k=0;k<4;k++){
              if(general_ids[j]['sockets'][k]['socket']==pair){
                general_ids[j]['sockets'][k]['state']=0
                break
              }
            
            }
          }
        }
      }
    }
    
    if (handle ==-1){
       
      nodes_uuid[indx]=null
      


   
    
    general_ids[indx]=null
    
    for(i=0;i< node_handler.length;i++){
      if(node_handler[i]==node_uuid){
        node_handler.splice(i,1)
      }
    }


    node_disc_handler.push(node_uuid)
  }
    //console.log('details of socket:',); 
    
    //if(!(nodes_uuid.length === ids.length)){
    //  console.log("Error arrays don't match!!")
    //}
    

    /*const idx_to_clean = verify(ids,socket.id)
    if(idx_to_clean===ids.length-1){
      
      ids.splice(idx_to_clean,1)
      nodes_uuid.splice(idx_to_clean,1)
      general_ids.splice(idx_to_clean,1)
      
    }else{
      ids[idx_to_clean]=null
      nodes_uuid[idx_to_clean]=null
      general_ids[idx_to_clean]=null
    }

    if(ids.length>0){
      console.log("c1: ",ids[ids.length-1]==null && ids.length ==nodes_uuid.length )
      while(ids[ids.length-1]==null && ids.length ==nodes_uuid.length ){
        ids.splice(ids.length-1,1)
        nodes_uuid.splice(nodes_uuid.length-1,1)
        if(ids.length==0) break;
      }
    }
    if(ids.length>0){
      console.log("c2: ",ids[0]==null && ids.length ==nodes_uuid.length)
      while(ids[0]==null && ids.length ==nodes_uuid.length ){
        ids.splice(0,1)
        nodes_uuid.splice(0,1)
        //ids.shift()
        //nodes_uuid.shift()
        if(ids.length==0) break;
      }
    }
    for(i=0;i<general_ids.length;i++){
      if(general_ids[i]!=null){

      }
    }*/
  
    for(i=0;i< ids.length;i++){
      if(ids[i]['id']==socket.id)
      {
        ids.splice(i,1)
      }
    } 

    for(i=0;i<ids.length;i++){ 
       
      if(ids[i]['paired_socket_id']==socket.id){
         ids[i]['paired_socket_id']=null
      }
    }
    

    while(nodes_uuid.length>0) {
    
    var nl=nodes_uuid.length
    console.log('entered in while loop',nl)
    if(nodes_uuid[nl-1]==null  ){
      console.log('enter in if part')
      nodes_uuid.splice(nl-1,1)
    }
    else
       break  
  }
   
  while(general_ids.length>0) {
    
    var nl=general_ids.length
    console.log('entered in while loop',nl)
    if(general_ids[nl-1]==null  ){
      console.log('enter in if part')
      general_ids.splice(nl-1,1)
    }
    else
       break  
  }
  console.log("final ids", ids)
    console.log("final nodes_uuids",nodes_uuid)
      
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))

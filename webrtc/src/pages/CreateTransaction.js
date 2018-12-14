import React, {Component} from 'react'
import {Menu,Button,Header,Grid,Input} from "semantic-ui-react"
import Layout from '../Style/Layout'
import Blockchain from '../Blockchain/Blockchain'
import PendingTransactions from '../Blockchain/PendingTransactions'
import DB from '../DB'
class CreateTransaction extends Component {
    state={
        data : new Array(5),
        blockchain: new Blockchain(),
        db : new DB('blockchain'),
        storedTx:null,
        incomingTx:null,
        ready : false
    }

    componentWillMount(){
        new Promise((resolve,reject)=>{
            resolve(this.state.db.getUUID())
            reject('Error geetting uuid')
        }).then(node_uuid=>{
            this.setState({node_uuid:node_uuid},console.log('node_uuid got in createTx: ',node_uuid))            
        })
    }

    setData = (order,e) => {        
        let data = this.state.data
        const value = e.target.value
        data[order]=value
        this.setState({data})
      }

    createTx = () => {
        const newTx = [...this.state.data]
        const Tx = {
            "amount":newTx[0],
            "sender":newTx[1],
            "recipient":newTx[2],
            "value4":newTx[3],
            "value5":newTx[4]
        }
        new Promise((resolve, reject) => {
            resolve(this.state.blockchain.createNewTransaction(Tx))
            reject('Error when triying to create a new Transaction')
        })
        .then( response => {
            console.log('Respuesta desde el servidor: ',response)
            new Promise((resolve,reject) => {
                resolve(this.sendTx(response))
                reject('Error when sending new transaction to another peer')
            }).then(()=> this.setState({storedTx:{...response}}))
            
        })
        .catch( error => {
            console.log('error trying to post a Transaction: ',error);
        })
        
    }

    header = () => {
        let ready = false
        let peerConns = [...this.props.peerConns]
        let i = 0
        for(let peerConn of peerConns){
            i = i +1
            if(peerConn['peerState'] === 'connected' || peerConn['peerState'] === 'completed'  ){
                //console.log(`Status of peerState number ${i} is: `,peerConn['peerState'])
                ready = true
            }
        }
        
        console.log('ready', ready)
        
        if(this.state.storedTx===null){
            return(
                <Menu>
                    <Button
                    content="Create Transaction"
                    icon="add circle"
                    labelPosition="left"
                    floated="left"
                    primary
                    onClick={this.createTx}
                    disabled = {!ready}
                        />
                </Menu>
            )
        }
    }

    headerOutput = () => {
        if(this.state.storedTx !== null) {
            return(
                <Menu>
                    <Button
                    content="Create another Transaction"
                    icon="add circle"
                    labelPosition="left"
                    floated="left"
                    primary
                    onClick={this.resetToCreateHandler}
                    disabled = {false}
                        />
                </Menu>
            )
        }
    }
    
    inputTx =  () => {
        if(this.state.storedTx === null){
            return(
                <Menu>      
                    <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
                        <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
                        DataSet 1:</Header></Grid> </Grid.Row>
                        
                        <Grid.Row style={{marginTop:"2px"}}>   
                        <Grid.Column>   
                            <Input label ="Tx-data1" labelPosition='left' placeholder="enter data"
                            onChange={e=>this.setData(0,e)} ></Input>
                        </Grid.Column>
                        <Grid.Column>            
                            <Input label ="Tx-data2" labelPosition='left' placeholder="enter data"
                            onChange={e=>this.setData(1,e)} ></Input>
                        </Grid.Column>
                        <Grid.Column>            
                            <Input label ="Tx-data3" labelPosition='left' placeholder="enter data"
                            onChange={e=>this.setData(2,e)} ></Input>
                        </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>          
                        <Grid.Column>            
                            <Input label ="Tx-data4" labelPosition='left' placeholder="enter data"
                            onChange={e=>this.setData(3,e)} ></Input>
                        </Grid.Column>
                        <Grid.Column>           
                            <Input label ="Tx-data5" labelPosition='left' placeholder="enter data"
                            onChange={e=>this.setData(4,e)} ></Input>
                        </Grid.Column>
                        </Grid.Row>         
                    </Grid>
                </Menu>
            )
        }
    }

    outputTx = () => {
        
        if(this.state.storedTx!==null){
            console.log('storedTx en outputTx: ',this.state.storedTx)
            return(
                <div>
                    <h2>New Transaction created:</h2>
                    <PendingTransactions pending_transactions={[this.state.storedTx]} />
                </div>
            )
        }
    }

    resetToCreateHandler = () => {
        this.setState({storedTx:null})
    }

    sendTx = newTx => {
        if(this.props.peerConns.length>0){
            //console.log('sending message socket id is:',
            //this.props.peerConns[0]['functionPc']['props']['socket']['id'])

            const dataToSend = JSON.stringify({
                'node_uuid': this.state.node_uuid,//this.props.peerConns[0]['functionPc']['props']['socket']['id'],
                'type':'pendingTx','message':newTx})
            
            console.log('data to send: ', dataToSend)

            this.props.peerConns.map(peerConn=>{
                if( typeof(peerConn['functionPc']) !== undefined ){
                    console.log('sending data to Peer: .............' )
                    peerConn['functionPc'].sendFileFcn(dataToSend)
                }else{
                    console.log('functionPc not defined in peerConn')
                }
                return 0
            })           
            
        }else{
            return(<h2>Warning no peers connected yet avoid creating trasactions until 
                connecting to another peer</h2>)
        }
    }
    

    render(){
        return(
            <Layout>
                <div style={{ marginTop: "10px" }}>                                        
                    {this.header()}
                    {this.headerOutput()}
                    {this.inputTx()}
                    {this.outputTx()}                    
                </div>
            </Layout>

        )
    }
}
export default CreateTransaction;
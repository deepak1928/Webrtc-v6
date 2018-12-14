import React, {Component} from 'react';
import {Menu,Button,Header,Grid,Input} from "semantic-ui-react";
import Blockchain from './Blockchain'
import ShowLatestBlock from './ShowLatestBlock'
import DB from '../DB'
import sendData from '../wrtconf/SendData';
import Layout from '../Style/Layout';

class CreateBlockChain extends Component {  

  state = {      
    blockchain:new Blockchain(),
    data : new Array(30),
    db: new DB('blockchain'),
    operations:false
  }

   /*getting initial props */
    componentDidMount(){
       new Promise((resolve,reject)=>{
           resolve(this.state.blockchain.getLastBlock())
           reject('Error triyin o get Last Block...')
       }).then(lastBlock=>{
        console.log("getFirst: ",lastBlock)
        this.setState({lastBlock})
       }).catch(e=>{
           console.log(`Database error..${e.toString()}`)
       })  
    }

    createBlockchain = async() => {
        const newTx = this.state.data
        const t1 = {
            "amount":newTx[0],
            "sender":newTx[1],
            "recipient":newTx[2],
            "value4":newTx[3],
            "value5":newTx[4],
        }
        
        const t2 = {
            "amount":newTx[5],
            "sender":newTx[6],
            "recipient":newTx[7],
            "value4":newTx[8],
            "value5":newTx[9],
        }

        const t3 = {
            "amount":newTx[10],
            "sender":newTx[11],
            "recipient":newTx[12],
            "value4":newTx[13],
            "value5":newTx[14],
        }

        const t4 = {
            "amount":newTx[15],
            "sender":newTx[16],
            "recipient":newTx[17],
            "value4":newTx[18],
            "value5":newTx[19],
        }

        const t5 = {
            "amount":newTx[20],
            "sender":newTx[21],
            "recipient":newTx[22],
            "value4":newTx[23],
            "value5":newTx[24],
        }

        const t6 = {
            "amount":newTx[25],
            "sender":newTx[26],
            "recipient":newTx[27],
            "value4":newTx[28],
            "value5":newTx[29]
        }

        const t = [t1,t2,t3,t4,t5,t6]
        new Promise((resolve,reject)=>{
            resolve(this.state.blockchain.createFirstBlockHandler(t))
            reject('Error creating first Block')
        })
        .then(firstBlock=>{
            console.log('firstBlock',firstBlock)
            const firstCreated = new Promise((resolve,reject)=>{
                resolve(this.state.blockchain.getLastBlock())
                reject('Error getting first block')
            })
            return firstCreated
        })
        .then(firstCreated=>{
            console.log("firstCreated: ",firstCreated)
            this.setState({lastBlock:firstCreated})
            const spread = new Promise((resolve,reject)=>{
                resolve(sendData({'data':firstCreated ,'type':'block', 'peerConns':this.props.peerConns}))
                reject('Error spreading new Block')
            })
            return spread
        })
        .then(spread=>{
            this.props.createdBlockChainHandler(true)
            this.setState({spread})
        })
    }

    setData = (order,e) => {
        //console.log(this.state.data);
        let data = this.state.data;
        const value = e.target.value;
        data[order]=value;
        this.setState({data});
    }

    receiveTxHandler = () => {
        const lastBlock = this.state.lastBlock
        if(!lastBlock){
            return <div style={{ marginTop: "10px" }}>
            <Menu>
            <Menu.Menu position = "left" style={{ marginBottom: "2px" }} >      
            <Button
            content="Create Blockchain"
            icon="add circle"
            labelPosition="left"
            floated="left"
            primary
            onClick={this.createBlockchain}
            disabled = {this.state.createdBlockchainInstance}
            />
            </Menu.Menu>               
            </Menu>

            <Header as='h3' style={ {marginTop: "30px"} } textAlign='center'>Data Sets: </Header>
            
            <Menu>      
            <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
            <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
            DataSet 1:</Header></Grid> </Grid.Row>
            
            <Grid.Row style={{marginTop:"2px"}}>          
                <Grid.Column>   
                <Input label ="Tx1-data1" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(0,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx1-data2" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(1,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx1-data3" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(2,e)} ></Input>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>          
                <Grid.Column>            
                <Input label ="Tx1-data4" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(3,e)} ></Input>
                </Grid.Column>
                <Grid.Column>           
                <Input label ="Tx1-data5" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(4,e)} ></Input>
                </Grid.Column>          
            </Grid.Row>            
            </Grid>
            </Menu>

            <Menu>   
            <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
            <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
            DataSet 2:</Header></Grid> </Grid.Row>
            
            <Grid.Row style={{marginTop:"2px"}}>          
                <Grid.Column>   
                <Input label ="Tx2-data1" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(5,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx2-data2" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(6,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx2-data3" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(7,e)} ></Input>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>          
                <Grid.Column>            
                <Input label ="Tx2-data4" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(8,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx2-data5" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(9,e)} ></Input>
                </Grid.Column>

            </Grid.Row>            
            </Grid>
            </Menu>


            <Menu>      
            <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
            <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
            DataSet 3:</Header></Grid> </Grid.Row>
            
            <Grid.Row style={{marginTop:"2px"}}>          
                <Grid.Column>   
                <Input label ="Tx3-data1" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(10,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx3-data2" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(11,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx3-data3" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(12,e)} ></Input>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>          
                <Grid.Column>            
                <Input label ="Tx3-data4" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(13,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx3-data5" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(14,e)} ></Input>
                </Grid.Column>          
            </Grid.Row>            
            </Grid>
            </Menu>

                <Menu>      
            <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
            <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
            DataSet 4:</Header></Grid> </Grid.Row>
            
            <Grid.Row style={{marginTop:"2px"}}>          
                <Grid.Column>   
                <Input label ="Tx4-data1" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(15,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx4-data2" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(16,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx4-data3" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(17,e)} ></Input>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>          
                <Grid.Column>            
                <Input label ="Tx4-data4" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(18,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx4-data5" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(19,e)} ></Input>
                </Grid.Column>          
            </Grid.Row>            
            </Grid>
            </Menu>

            <Menu>      
            <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
            <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
            DataSet 5:</Header></Grid> </Grid.Row>
            
            <Grid.Row style={{marginTop:"2px"}}>          
                <Grid.Column>   
                <Input label ="Tx5-data1" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(20,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx5-data2" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(21,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx5-data3" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(22,e)} ></Input>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>          
                <Grid.Column>            
                <Input label ="Tx5-data4" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(23,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx5-data5" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(24,e)} ></Input>
                </Grid.Column>          
            </Grid.Row>            
            </Grid>
            </Menu> 

            <Menu>      
            <Grid columns={3} style={{marginRight:"-80px",marginLeft:"2px",marginTop:"1px", marginBottom:"1px" }} >
            <Grid.Row> <Grid columns={1}><Header as='h5' style={{marginBottom:"-20px",marginLeft:"20px",marginTop:"1px"}} >
            DataSet 6:</Header></Grid> </Grid.Row>
            
            <Grid.Row style={{marginTop:"2px"}}>          
                <Grid.Column>   
                <Input label ="Tx6-data1" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(25,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx6-data2" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(26,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx6-data3" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(27,e)} ></Input>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>          
                <Grid.Column>            
                <Input label ="Tx6-data4" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(28,e)} ></Input>
                </Grid.Column>
                <Grid.Column>            
                <Input label ="Tx6-data5" labelPosition='left' placeholder="enter data"
                onChange={e=>this.setData(29,e)} ></Input>
                </Grid.Column>          
            </Grid.Row>            
            </Grid>
            </Menu>
        </div>
            
        }
        
    }

    a = () => {
        this.setState({operations:true})
    }

    showLatestBlock = () => {
        const lastBlock = this.state.lastBlock
        if(lastBlock){
            return(
                <div>                    
                    <ShowLatestBlock block={this.state.lastBlock}/>
                </div>
            )
        }
    }

    render(){
        return(
            <Layout>
                {this.receiveTxHandler()}
                {this.showLatestBlock()}
                {this.state.spread}
            </Layout>
        )
    }
}

export default CreateBlockChain;
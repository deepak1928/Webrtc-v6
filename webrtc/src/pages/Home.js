import React , {Component} from 'react'
import Layout from '../Style/Layout';
import PendingTransactions from '../Blockchain/PendingTransactions';
import ShowLatestBlock from '../Blockchain/ShowLatestBlock';

class Home extends Component {    
    showIncomingBlock = () => {
        console.log('block received in showIncomingBlock: ', this.props.lastBlock)
        if(this.props.lastBlock){
            console.log('block received in showIncomingBlock: ', this.props.lastBlock)
            return(
                <div>
                    <h3>Updating local Chain:</h3>
                    <ShowLatestBlock block={this.props.lastBlock}/>
                </div>
            )
        }
        else if(this.props.block){
            const {message, node_uuid} = this.props.block
            const block = message
            if(block && !this.props.savedBlock){
                console.log('new block received',block)
                return(
                    <div>
                        <h3>Processing new Block received from peer {node_uuid} </h3>   
                        <ShowLatestBlock block={block}/>
                    </div>
                )
            }else if(block && this.props.savedBlock){
                return(
                    <div>
                        <h3>Coming Block from peer {node_uuid} has been saved on local Database.</h3>   
                        <ShowLatestBlock block={block}/>
                    </div>
                )
            }
        }
    }
    showIncomingTx = () =>{
        console.log('receiving incoming tx: ', this.props)
        if(this.props.newTx){
            const {message, node_uuid} = this.props.newTx
            const newTx = message
            if(newTx){
                console.log('Incoming Tx: ',newTx)
                return(
                    <div>
                        <h3>New Transaction received from node {node_uuid}:</h3>                    
                        <PendingTransactions pending_transactions={[newTx]} />
                    </div>
                )
            }

        }                       
    }

    showOutgoingUpdate = () => {
        if(this.props.resultBroadcastUpdateMsg){
            const message = this.props.resultBroadcastUpdateMsg
            console.log('resultBroadcast' , message)
            return <div>{message}</div>
        }
    }
    render(){
        return(
            <Layout><br/>
                {this.showIncomingBlock()}
                {this.showIncomingTx()}
                {this.showOutgoingUpdate()}
            </Layout>
        )
    }
}

export default Home
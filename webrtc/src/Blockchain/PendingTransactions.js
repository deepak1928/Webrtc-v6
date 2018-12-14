import React, {Component} from 'react';
import {List,Card} from "semantic-ui-react";
class PendingTransactions extends Component {
    state = {

    }
    render(){
        let data =  this.props.pending_transactions;
        let render_transactions = () => {
            if(data){
                let i=0;
            console.log('data en render transactions', data);
            const txs =data.map(transaction=>{
              i++;
              return { //la llave debe estar en la misma linea en donde esta el map!!
                header:'Transaction ' + i,
                description: <div><List>
                <List.Item><List.Header>amount</List.Header>{transaction['amount']}</List.Item>
              </List>
              <List>
                <List.Item><List.Header>sender</List.Header>{transaction['sender']}</List.Item>
              </List>
              <List>
                <List.Item><List.Header>recipient</List.Header>{transaction['recipient']}</List.Item>
              </List>
              <List>
                <List.Item><List.Header>value4</List.Header>{transaction['value4']}</List.Item>
              </List>
              <List>
                <List.Item><List.Header>value 5</List.Header>{transaction['value5']}</List.Item>
              </List></div>
              }
        
              //console.log(i,transaction);
              
            })
            //console.log('txs',txs);
            return (<Card.Group items={txs}/>)

            }
            
          }



        return(<div>{render_transactions()}</div>)
    }

}

export default PendingTransactions;
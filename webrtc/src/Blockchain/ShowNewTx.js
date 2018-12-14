import React, {Component} from 'react';
import {List,Header,Card} from "semantic-ui-react";

class ShowNewTx extends Component {

render(){
  console.log('Objeto recibido en ShowNewTx:',this.props.newTx)
  let render_transactions = () => {
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




  return(
    <div style={{ marginTop: "40px" }}>
      <Header as='h3' style={ {marginTop: "30px"} } textAlign='center'>Block Creation Results: </Header>
      <List>
        <List.Item><List.Header>Index</List.Header>{index}</List.Item>
        <List.Item><List.Header>PreviousHash</List.Header>{previousHash}</List.Item>
        <List.Item><List.Header>TimeStamp</List.Header>{timestamp}</List.Item>
        <List.Item><List.Header>DataSets(transactions)</List.Header>
          {render_transactions()}
        </List.Item>
        <List.Item><List.Header>Block Hash</List.Header>{hash}</List.Item>
        <List.Item><List.Header>Nonce</List.Header>{nonce}</List.Item>
      </List>
    </div>
  )

  }
}

export default ShowNewTx;
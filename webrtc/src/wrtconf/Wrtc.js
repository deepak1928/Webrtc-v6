import React , {Component} from 'react'
import NewPeer from './NewPeer'
export default class Wrtc extends Component {
    state= {
        rtcPeerConn:[],
        sendDataChannel:[],
        catchDataChannel:[]
    }

    render(){

        return(
            <div>         
                <NewPeer socket = {this.props.socket}
                peer_id={this.props.peer_id}/>
            </div>
        )

    }

}
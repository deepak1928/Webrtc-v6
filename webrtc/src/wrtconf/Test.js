import React , {Component} from 'react'
export default class Test extends Component {
    state= {
    }

    signalingMessageHandler = data => {
        console.log("this.signalingMessageHandler in test received: " , data)
    }

    render(){
        const socket = this.props.socket
        socket.on('signaling_message',(data) => socket.emit('xyz',
        data,this.signalingMessageHandler))

        return(
            <div>
                Hello I am a test           
            </div>
        )

    }

}
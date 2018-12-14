import React from "react";
//import Header from "./Header.js";
import { Container } from "semantic-ui-react";
export default props => {
  return (
    <Container>
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.1/semantic.min.css"
        />
      {props.children}
    </Container>
  )
}
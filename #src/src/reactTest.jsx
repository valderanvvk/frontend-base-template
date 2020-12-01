import React from 'react'
import ReactDOM from 'react-dom'

class HelloMessage extends React.Component {
  render() {
    return (
      <div>
        {this.props.name} - it works!
      </div>
    );
  }
}

ReactDOM.render(
  <HelloMessage name="JSX" />,
  document.getElementById('message__react-example')
);
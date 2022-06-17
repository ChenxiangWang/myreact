import React from '../react';

const element = (
    <div id="foo">
        <h1>React study</h1>
        <p>This is a short paragraph</p>
    </div>
)

React.render(element, document.querySelector("#root"));

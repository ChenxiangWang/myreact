import React from "../react";

const { useState } = React;

const TaskApp = (props) => {
    const [state, setState] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [input, setInput] = useState("");

    const inputHandler = (event) => {
        setTasks(() => [...tasks, event.target.value])
        setState( () => state + 1)
    }

    const handleDeleteTask = (index) => {
        const newTasks = tasks.filter((item, i) => {
            return i !== index;
        })
        setState(() => state - 1);
        setTasks(() => newTasks);
    }

    return(
        <div>
            <h1>Task Management</h1>
            <p>You hava { state } tasks: </p>
            <ul>
                {tasks.map((task,index) => <li onclick={() => handleDeleteTask(index)}>{task}</li>)}
            </ul>
            <input value={input} onchange={inputHandler}/>
            <button onclick={() => setState ( (prv) => prv + 1 )}>Add one</button>
        </div>
    )
}
export default TaskApp;
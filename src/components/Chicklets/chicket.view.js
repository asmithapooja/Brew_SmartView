import React, {useState} from "react";

const Chicklets = (props) => {

    // Handle Selection of chicklets!
    const [isSelected, setIsSelected] = useState(false);
    function handleSelect(node){
        if(!isSelected){
            // setIsSelected(!isSelected);
            const select = props.chickletSelect(node);

            if(select){
                setIsSelected(!isSelected);
            }
            
        } else {
            setIsSelected(!isSelected);
            props.chickletSelect(node);
        }
    }

    return(
        <div className = "" style = {{width: "160px"}} onClick = {() => handleSelect(props.node)}>
            <span className = "card chicklet-view text-center" style = {{backgroundColor: isSelected ? "#2f92f5" : "#B2FF66"}}>
                {props.node} 
            </span>
        </div>
    )
}

export default Chicklets;
import React from "react";
import Image from "./assets/priyanshu.png"


function Greating ({ name, age}) {
    return(
        <>
        <div className="demo">
            <img src={Image} alt="" />
            <h2> Hello, my name is {name}
                and I am {age} years old. </h2>
        </div>
        
        </>
    );
}
export default Greating;
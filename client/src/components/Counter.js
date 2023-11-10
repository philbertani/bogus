import { useState, useEffect } from 'react'; 
  
const useCounter = () => { 
  
    const [count, setCount] = useState(0); 
  
    useEffect(() => { 
  
        //Implementing the setInterval method 
        const interval = setInterval(() => { 
            setCount(count + 1); 
        }, 1000); 
  
        //Clearing the interval 
        return () => clearInterval(interval); 
    }, [count]); 
  
    return count;
} 
  
export default useCounter;
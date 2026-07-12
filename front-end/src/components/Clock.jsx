import React, { useState, useEffect } from "react";

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-center align-items-center">
        <h5>{time.toLocaleTimeString()}</h5>
      </div>
    </div>
  );
}

export default Clock;

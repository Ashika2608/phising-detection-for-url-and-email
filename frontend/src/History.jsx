import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/history")
      .then(res => res.json())
      .then(data => setHistory(data));
  }, []);

  return (
    <div className="container">
      <h1>📜 Prediction History</h1>
      <Link to="/" className="back-link">⬅ Back to Checker</Link>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Result</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td>{item.url}</td>
                <td className={item.result.toLowerCase()}>{item.result}</td>
                <td>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default History;
import Dropdown from 'react-bootstrap/Dropdown'
import 'bootstrap/dist/css/bootstrap.min.css'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import React, { useEffect, useState } from "react"
import Button from 'react-bootstrap/Button'
import axios from 'axios'

/**
 * React dropdown menu
 * Source: https://react-bootstrap.github.io/components/dropdowns/
 */
function UserButton() {
  // const [elasticData, setElastic] = useState(null)
  const [userid, setUserId] = useState(null)
  const [similarityMethod, setSimilarityMethod] = useState(null)
  const [similarityMethodName, setSimilarityMethodName] = useState(null)
  const [numberOfResults, setNumberOfResults] = useState(null)
  const [topUsers, setTopUsers] = useState(null)
  const [movieRec, setMovieRec] = useState(null)
  const [executionTime, setExecutionTime] = useState(null)
  const [minNumRatings, setMinNumRatings] = useState(0)

  // parsing user id
  function handleUserIdChange(userIdEvent) {
    setUserId(userIdEvent.target.value)
  }

  function handleSimilarityMethod(similarityMethod) {
    const simMethod = similarityMethod.split(",")
    setSimilarityMethod(simMethod[0])
    // Updates similarity method name in button
    setSimilarityMethodName(simMethod[1])
  }

  function handleNumberOfResults(event) {
    setNumberOfResults(event.target.value)
  }

  function handleSimilarityMethodChange(e) {
    if (userid) {
      const data = JSON.stringify({
        simMtd: similarityMethod,
        userId: userid,
        num: numberOfResults,
        numRatings: minNumRatings
      })

      if (e.target.id === 'topusers') {
      axios({
        method: 'post',
        url: 'http://localhost:8000/topusers',
        headers: {'Content-Type': 'application/json'},
        data: data
      }).then((response) => {
        // console.log(response.data)
        setExecutionTime(response.data.pop())
        setTopUsers(response.data)
        setMovieRec(null)
      })
    } else if (e.target.id === 'movierec') {
      axios({
        method: 'post',
        url: 'http://localhost:8000/movierecommendations',
        headers: {'Content-Type': 'application/json'},
        data: data
      }).then((response) => {
        // console.log(response.data)
        setExecutionTime(response.data.pop())
        setMovieRec(response.data)
        setTopUsers(null)
      })
    }
    }
  }

  // if (!elasticData) return "No Content"

  return (
    <div style={{ display: "flex", 'justifyContent': 'center', "padding": '50px'}}>
      <Form.Group className="mb-3" controlId="formBasicUserId" style={{ padding: '10px', width: '150px' }}>
        <Form.Control type="text" onChange={handleUserIdChange} placeholder="User ID" />
      </Form.Group>

      <DropdownButton id="dropdown-button" title={similarityMethodName || "Similarity"} style={{padding: '10px'}} onSelect={handleSimilarityMethod}>
        <Dropdown.Item eventKey={['1', 'Euclidean']}>Euclidean</Dropdown.Item>
        <Dropdown.Item eventKey={['2', 'Pearson']}>Pearson</Dropdown.Item>
      </DropdownButton>

      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail" style={{padding: '10px', width: '150px'}}>
        <Form.Control type="text" onChange={handleNumberOfResults} placeholder="# of results" />
        </Form.Group>
      </Form>

      <Form.Group className="mb-3" controlId="formBasicNumRatings" style={{ padding: '10px', width: '200px' }}>
      <Form.Control type="text" onChange={(e) => setMinNumRatings(e.target.value)} placeholder="Min Num Ratings" />
      </Form.Group>

      <div style={{ display: "flex", position: "absolute", "marginTop": "100px", "marginLeft": "250px"}}>
        <Button variant="success" id="topusers" onClick={handleSimilarityMethodChange}>Find top matching users</Button>{' '}
      </div>

      <div style={{ display: "flex", position: "absolute", "marginTop": "100px", marginRight: "250px"}}>
      <Button variant="success" id="movierec" onClick={handleSimilarityMethodChange}>Find movie recommendations</Button>{' '}
      </div>
        
      {topUsers &&
      <div style={{ flexDirection: "column", alignItems: "center", position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)" }}>
      <h3>Results</h3>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "300px" }}>
        <p><b>Execution Time MiliSeconds:</b> {executionTime && executionTime.ExecTimeMs}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "100px", width: "200px" }}>
        <p><b>Execution Time Seconds:</b> {executionTime && (executionTime.ExecTimeMs / 1000).toFixed(2)}</p>
      </div>

      <div style={{ display: "flex",  position: "absolute", flexDirection: "column", alignItems: "center", marginTop: "0px", width: "500px" }}>
          <Table striped bordered hover size="lg">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
          {topUsers.map(d => (<tr><td>{d.userId}</td> <td>{d.simScore.toFixed(4)}</td></tr>))}
          </tbody>
        </Table> 
          </div>
        </div>
      }

{movieRec &&
  <div style={{ position: "absolute", flexDirection: "column", alignItems: "center", top: "30%", left: "50%", transform: "translate(-50%, -50%)" }}>
  <h3>Results</h3>

  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "300px" }}>
    <p><b>Execution Time MiliSeconds:</b> {executionTime && executionTime.ExecTimeMs}</p>
  </div>

  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "100px", width: "200px" }}>
    <p><b>Execution Time Seconds:</b> {executionTime && (executionTime.ExecTimeMs / 1000).toFixed(2)}</p>
  </div>

  <div style={{ display: "flex", position: "absolute", flexDirection: "column", alignItems: "center", marginTop: "0px", width: "500px" }}>
    <Table striped bordered hover size="lg">
        <thead>
          <tr>
            <th>User Id</th>
            <th>MovieTitle</th>
            <th>User Similarity Score</th>
            <th>Num Rating</th>
          </tr>
        </thead>
        <tbody>
          {movieRec.map(d => (<tr><td>{d.userid}</td><td>{d.movietitle}</td> <td>{d.simscore}</td><td>{d.numrating}</td></tr>))}
        </tbody>
      </Table> 
        </div>
      </div>
      }
    </div>
  )
}

export default UserButton;

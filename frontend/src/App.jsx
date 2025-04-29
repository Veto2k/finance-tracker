import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Dashboard from './Dashboard.jsx'
import Homepage from './Homepage.jsx'
import Login from './login.jsx'
import Signup from './Signup.jsx'
import ProtectedRoute from "./ProtectedRoute.jsx";
import Transactions from './Transactions.jsx'
import Budgets from './Budgets.jsx'
import Reports from './Reports.jsx'
import Profile from './Profile.jsx'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element = {<Dashboard/>}/>
          <Route path="/transactions" element={<Transactions/>}/>
          <Route path="/budgets" element={<Budgets/>}/>
          <Route path="/profile" element={<Profile/>}/>
        </Route>
      </Routes>
    </Router>
    </>
  )
}

export default App

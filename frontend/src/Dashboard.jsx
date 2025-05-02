import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faArrowUp,
  faArrowDown,
  faCalendar,
  faClock,
  faChartLine,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Navbar from './Navbar';
import './Dashboard.css';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine, ReferenceDot, Scatter } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { 
  VictoryChart, 
  VictoryScatter, 
  VictoryAxis, 
  VictoryLabel, 
  VictoryTheme,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLine,
  VictoryBar,
  VictoryTooltip
} from 'victory';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    avgIncome: 0,
    avgExpenses: 0,
    avgSavings: 0,
    thisMonthExpensesTotal: 0,
    thisMonthIncomeTotal: 0,
    thisMonthSavingsTotal: 0,
    expensesPercentageChange: 0,
    incomePercentageChange: 0,
    savingsPercentageChange: 0,
    expensesColor: 'neutral',
    incomeColor: 'neutral',
    savingsColor: 'neutral'
  });
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [radialData, setRadialData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  const [budgetPeriod, setBudgetPeriod] = useState('current');
  const [transactionPeriod, setTransactionPeriod] = useState('current');
  const [isCurrentMonthTransactions, setIsCurrentMonthTransactions] = useState(true);

  const fetchTransactions = async (period) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const currentDate = new Date();
      let startDate, endDate;

      if (period === "current") {
        startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1));
        endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
      } else {
        startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 0));
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await axios.get("http://localhost:3000/dashboard/transactions", {
        headers,
        params: {
          sortField: "amount",
          sortOrder: "desc",
          limit: 5,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  const fetchBudgets = async (period) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const currentDate = new Date();
      let startDate, endDate;

      if (period === "current") {
        startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1));
        endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
      } else {
        startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 0));
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await axios.get("http://localhost:3000/dashboard/budget", {
        headers,
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      setBudgets(response.data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setBudgets([]);
    }
  };

  const fetchBarData = async (date) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const response = await axios.get("http://localhost:3000/dashboard/bar_graph", {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      setBarData(response.data);
    } catch (error) {
      console.error("Error fetching bar graph data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Fetch metrics and radial data
        const [metricsRes, radialRes] = await Promise.all([
          axios.get("http://localhost:3000/dashboard/average_expenses", { headers }),
          axios.get("http://localhost:3000/dashboard/radial_graph", { headers })
        ]);

        let rd = radialRes.data;

        rd = rd.map(item => ({ month: item.month, income: item.income, expenses: item.expenses }));

       

        setRadialData(rd);
        setMonthlyTrends(radialRes.data);

        const { 
          avgExpenses, 
          avgIncome, 
          avgSavings,
          thisMonthExpensesTotal,
          thisMonthIncomeTotal,
          thisMonthSavingsTotal,
          expensesPercentageChange,
          incomePercentageChange,
          savingsPercentageChange,
          expensesColor,
          incomeColor,
          savingsColor
        } = metricsRes.data;
        
        setMetrics({
          avgIncome: avgIncome || 0,
          avgExpenses: avgExpenses || 0,
          avgSavings: avgSavings || 0,
          thisMonthExpensesTotal: thisMonthExpensesTotal || 0,
          thisMonthIncomeTotal: thisMonthIncomeTotal || 0,
          thisMonthSavingsTotal: thisMonthSavingsTotal || 0,
          expensesPercentageChange: expensesPercentageChange || 0,
          incomePercentageChange: incomePercentageChange || 0,
          savingsPercentageChange: savingsPercentageChange || 0,
          expensesColor: expensesColor || 'neutral',
          incomeColor: incomeColor || 'neutral',
          savingsColor: savingsColor || 'neutral'
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.message === 'No authentication token found') {
          setError("Please log in to view your dashboard");
        } else {
          setError("Failed to load dashboard data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch initial data
    fetchData();
    
    // Initial fetch of transactions and budgets with current period
    fetchTransactions('current');
    fetchBudgets('current');
    
    // Initial fetch of bar data with current date
    fetchBarData(selectedDate);
  }, []);

  // Separate useEffect for transactions
  useEffect(() => {
    fetchTransactions(transactionPeriod);
  }, [transactionPeriod]);

  useEffect(() => {
    fetchBudgets(budgetPeriod);
  }, [budgetPeriod]);


  useEffect(() => {
    fetchBarData(selectedDate);
  }, [selectedDate]);

  const moneyFormatter = (value) => {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {moneyFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const toggleBudgetPeriod = () => {
    setBudgetPeriod(prev => prev === 'current' ? 'previous' : 'current');
    setIsCurrentMonth(prev => !prev);
  };

  const toggleTransactionPeriod = () => {
    setTransactionPeriod(prev => prev === 'current' ? 'previous' : 'current');
    setIsCurrentMonthTransactions(prev => !prev);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-state">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="error-state">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-title">Monthly Income</div>
            <div className="metric-value">
              {metrics.thisMonthIncomeTotal.toLocaleString("en-US", { style: "currency", currency: "INR" })}
            </div>
            <div className={`metric-trend ${metrics.incomeColor === 'green' ? 'trend-positive' : 'trend-negative'}`}>
              {metrics.incomeColor === 'green' ? 
                <FontAwesomeIcon icon={faArrowUp} /> : 
                <FontAwesomeIcon icon={faArrowDown} />}
              {metrics.incomePercentageChange.toFixed(1)}% vs average
            </div>
            <div className="metric-subtitle">
              Avg: {metrics.avgIncome.toLocaleString("en-US", { style: "currency", currency: "INR" })}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Monthly Expenses</div>
            <div className="metric-value">
              {metrics.thisMonthExpensesTotal.toLocaleString("en-US", { style: "currency", currency: "INR" })}
            </div>
            <div className={`metric-trend ${metrics.expensesColor === 'green' ? 'trend-positive' : 'trend-negative'}`}>
              {metrics.expensesColor === 'green' ? 
                 <FontAwesomeIcon icon={faArrowDown}/> : 
                 <FontAwesomeIcon icon={faArrowUp} />}
              {metrics.expensesPercentageChange.toFixed(1)}% vs average
            </div>
            <div className="metric-subtitle">
              Avg: {metrics.avgExpenses.toLocaleString("en-US", { style: "currency", currency: "INR" })}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Monthly Savings</div>
            <div className="metric-value">
              {metrics.thisMonthSavingsTotal.toLocaleString("en-US", { style: "currency", currency: "INR" })}
            </div>
            <div className={`metric-trend ${metrics.savingsColor === 'green' ? 'trend-positive' : 'trend-negative'}`}>
              {metrics.savingsColor === 'green' ? 
                <FontAwesomeIcon icon={faArrowUp} /> : 
                <FontAwesomeIcon icon={faArrowDown} />}
              {metrics.savingsPercentageChange.toFixed(1)}% vs average
            </div>
            <div className="metric-subtitle">
              Avg: {metrics.avgSavings.toLocaleString("en-US", { style: "currency", currency: "INR" })}
            </div>
          </div>
        </div>
        <div className="charts-grid">
        <div className="radial-graph-container">
      <h2>Monthly Savings Overview</h2>
      <div className="radial-chart quadrant-chart">
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={{ x: 30 }}
          padding={{ top: 30, right: 80, bottom: 40, left: 80 }}
          height={400}
          width={550}
          horizontal
          animate={{
            duration: 500,
            onLoad: { duration: 500 }
          }}
          containerComponent={
            <VictoryContainer
              responsive={true}
              style={{
                touchAction: "auto",
                maxWidth: "100%",
              }}
            />
          }
        >
          <VictoryAxis
            dependentAxis
            tickFormat={(x) => `₹${Math.abs(x/1000)}K`}
            style={{
              axis: { stroke: "#e0e0e0", strokeWidth: 1 },
              grid: { stroke: "#f5f5f5", strokeWidth: 1 },
              tickLabels: { fontSize: 12, padding: 5, fill: "#666", fontFamily: "'Poppins', sans-serif" },
            }}
            label="Amount (₹)"
            axisLabelComponent={
              <VictoryLabel dy={-50} style={{ fontSize: 14, fill: "#555", fontFamily: "'Poppins', sans-serif", fontWeight: "500" }} />
            }
          />
          <VictoryAxis
            tickFormat={radialData.map((item) => item.month)}
            style={{
              axis: { stroke: "#e0e0e0", strokeWidth: 1 },
              tickLabels: {
                fontSize: 14,
                padding: 15,
                fill: "#333",
                fontWeight: "bold",
                fontFamily: "'Poppins', sans-serif"
              },
            }}
          />
          <VictoryBar
            data={radialData.map((item) => ({
              month: item.month,
              value: item.income - item.expenses,
              income: item.income,
              expenses: item.expenses
            }))}
            x="month"
            y="value"
            barWidth={24}
            cornerRadius={{ top: 5, bottom: 5 }}
            style={{
              data: {
                fill: ({ datum }) => (datum.value < 0 ? "#ff6b6b" : "#4ade80"),
                stroke: ({ datum }) =>
                  datum.value < 0 ? "#ff4d6d" : "#22c55e",
                strokeWidth: 1,
                filter: "drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1))"
              },
            }}
            labels={({ datum }) => {
              const formattedValue = Math.abs(datum.value).toLocaleString("en-IN", { 
                style: "currency", 
                currency: "INR",
                maximumFractionDigits: 0 
              });
              
              return [
                `${datum.month}`,
                `${datum.value < 0 ? "Loss" : "Profit"}: ${formattedValue}`
              ];
            }}
            labelComponent={
              <VictoryTooltip
                flyoutStyle={{
                  stroke: datum => datum.value < 0 ? "#ffb1b0" : "#a7f3d0",
                  strokeWidth: 1.5,
                  fill: "rgba(255, 255, 255, 0.98)",
                  filter: "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.1))"
                }}
                flyoutPadding={{ top: 12, bottom: 12, left: 16, right: 16 }}
                style={[
                  { 
                    fontSize: 15, 
                    fontWeight: "bold",
                    fontFamily: "'Poppins', sans-serif",
                    fill: "#1e293b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  },
                  { 
                    fontSize: 16,
                    fontWeight: "bold", 
                    fontFamily: "'Poppins', sans-serif",
                    fill: ({ datum }) => (datum.value < 0 ? "#e11d48" : "#16a34a")
                  }
                ]}
                cornerRadius={8}
                pointerLength={10}
                pointerWidth={14}
                center={{ x: 225, y: 200 }}
                constrainToVisibleArea
                dx={0}
                dy={0}
              />
            }
          />
        </VictoryChart>
      </div>

      {/* Enhanced Legend */}
      <div className="enhanced-legend">
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#4ade80", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
          ></span>
          <span>Profit</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#ff6b6b", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
          ></span>
          <span>Loss</span>
        </div>
      </div>
    </div>

    <div className="bar-graph-container">
      <div className="bar-graph-header-flex">
      <h2>Monthly Expenses by Category</h2>
      <div className="date-picker-container">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          className="month-picker"
        />
      </div>
      </div>
      <div className="bar-chart">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={barData}
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis 
              dataKey="_id" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => value.toLocaleString("en-US", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
              })}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => value.toLocaleString("en-US", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
              })}
            />
            <Bar
              dataKey="totalamount"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

  <div className="dashboard-grid">
    {/* Latest Transactions */}
    <div className="section-card">
      <div className="section-header">
        <h2>Top Expenses</h2>
        <div className="period-toggle">
          <button 
            className={`toggle-btn ${!isCurrentMonthTransactions ? 'active' : ''}`}
            onClick={toggleTransactionPeriod}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="period-label">
            {isCurrentMonthTransactions ? 'This Month' : 'Last Month'}
          </span>
          <button 
            className={`toggle-btn ${isCurrentMonthTransactions ? 'active' : ''}`}
            onClick={toggleTransactionPeriod}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      <div className="transactions-list">
        {transactions.map(transaction => (
          <div key={transaction._id} className="transaction-item">
            <div className="transaction-info">
              <div className="transaction-description">{transaction.description}</div>
              <div className={`transaction-amount ${transaction.type === 'revenue' ? 'amount-positive' : 'amount-negative'}`}>
                {transaction.type === 'revenue' ? '+' : '-'}
                {Math.abs(transaction.amount).toLocaleString("en-US", { style: "currency", currency: "INR" })}
              </div>
            </div>
            <div className="transaction-details">
              <div className="transaction-date">
                <FontAwesomeIcon icon={faCalendar} /> {new Date(transaction.date).toLocaleDateString()}
              </div>
              <div className="transaction-tags">
                {transaction.tags && transaction.tags.length > 0 ? (
                  transaction.tags.map((tag, index) => (
                    <span key={index} className="tag">{typeof tag === 'object' ? tag.name : tag}</span>
                  ))
                ) : (
                  <span className="tag">No tags</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="no-data-message">No transactions found for this period</div>
        )}
      </div>
    </div>

    {/* Top Budgets */}
    <div className="section-card">
      <div className="section-header">
        <h2>Top Budgets</h2>
        <div className="period-toggle">
          <button 
            className={`toggle-btn ${!isCurrentMonth ? 'active' : ''}`}
            onClick={toggleBudgetPeriod}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="period-label">
            {isCurrentMonth ? 'This Month' : 'Last Month'}
          </span>
          <button 
            className={`toggle-btn ${isCurrentMonth ? 'active' : ''}`}
            onClick={toggleBudgetPeriod}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      <div className="budgets-list">
        {budgets.map(budget => {
          const progress = (budget.current / budget.limit) * 100;
          const remaining = budget.limit - budget.current;
          const daysRemaining = Math.ceil((new Date(budget.endDate) - new Date()) / (1000 * 60 * 60 * 24));
          const dailyLimit = (budget.limit / 30).toFixed(2);

          return (
            <div key={budget._id} className="budget-item">
              <div className="budget-header">
                <h3>{budget.name}</h3>
                <div className="budget-amount">
                  {budget.current.toLocaleString("en-US", { style: "currency", currency: "INR" })} of {budget.limit.toLocaleString("en-US", { style: "currency", currency: "INR" })}
                </div>
              </div>

              <div className="budget-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: progress > 100 ? '#ff4444' : '#4CAF50'
                    }}
                  ></div>
                </div>
                <div className="progress-label">{progress.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  <div className="monthly-trends-section">
    <div className="report-card">
      <h2>
        <FontAwesomeIcon icon={faChartLine} className="report-icon" />
        Monthly Income vs. Expenses
      </h2>
      <div className="chart-container">
        {monthlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlyTrends}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={1} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tickFormatter={moneyFormatter} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: 10 }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                name="Income"
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 5, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                name="Expenses"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 5, strokeWidth: 1, fill: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">No monthly trends data available</div>
        )}
      </div>
    </div>
  </div>
</div>
</div>
  );
};

export default Dashboard;
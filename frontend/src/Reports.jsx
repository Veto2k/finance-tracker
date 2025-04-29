import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp,
  faArrowDown,
  faChartLine,
  faChartBar,
  faListAlt,
  faCalendarAlt,
  faExclamationTriangle,
  faCalendar
} from '@fortawesome/free-solid-svg-icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector
} from 'recharts';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [dailySpending, setDailySpending] = useState([]);
  const [biggestTransactions, setBiggestTransactions] = useState([]);
  const [incomeHistory, setIncomeHistory] = useState([]);
  
  useEffect(() => {
    const fetchReportData = async () => {
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

        // First check if the reports API is accessible
        try {
          const testResponse = await axios.get("http://localhost:3000/reports/test", { headers });
          console.log("Reports API test response:", testResponse.data);
        } catch (testError) {
          console.error("Reports API test failed:", testError);
          throw new Error("Reports API is not accessible. Please check if the server is running.");
        }
        
        // Fetch all report data in parallel
        const [
          monthlyTrendsRes, 
          categorySpendingRes, 
          budgetProgressRes,
          dailySpendingRes,
          biggestTransactionsRes,
          incomeHistoryRes
        ] = await Promise.all([
          axios.get("http://localhost:3000/reports/monthly_trends", { headers })
            .catch((error) => {
              console.error("Monthly trends fetch error:", error);
              return { data: getMockMonthlyTrends() };
            }),
          axios.get("http://localhost:3000/reports/category_spending", { headers })
            .catch((error) => {
              console.error("Category spending fetch error:", error);
              return { data: getMockCategorySpending() };
            }),
          axios.get("http://localhost:3000/budgets/get", { 
            headers,
            params: { ifDashBoard: true }
          }).catch((error) => {
            console.error("Budget progress fetch error:", error);
            return { data: getMockBudgetProgress() };
          }),
          axios.get("http://localhost:3000/reports/daily_spending", { headers })
            .catch((error) => {
              console.error("Daily spending fetch error:", error);
              return { data: getMockDailySpending() };
            }),
          axios.get("http://localhost:3000/transactions/get", { 
            headers,
            params: {
              sortField: "amount",
              sortOrder: "desc",
              page: 1,
              limit: 5,
            }
          }).catch((error) => {
            console.error("Biggest transactions fetch error:", error);
            return { data: { formattedTransactions: getMockBiggestTransactions() } };
          }),
          axios.get("http://localhost:3000/reports/income_history", { headers })
            .catch((error) => {
              console.error("Income history fetch error:", error);
              return { data: getMockIncomeHistory() };
            })
        ]);
        
        // Debug raw API responses
        console.log("Raw API responses:", {
          monthlyTrends: monthlyTrendsRes.data,
          categorySpending: categorySpendingRes.data,
          budgetProgress: budgetProgressRes.data,
          dailySpending: dailySpendingRes.data,
          biggestTransactions: biggestTransactionsRes.data,
          incomeHistory: incomeHistoryRes.data
        });
        
        // Check if any data has non-zero values
        const hasMonthlyData = monthlyTrendsRes.data && monthlyTrendsRes.data.some(
          month => month.income > 0 || month.expenses > 0
        );
        
        console.log("Has monthly data with non-zero values:", hasMonthlyData);
        
        // If API returns empty data, use mock data instead
        const monthlyData = hasMonthlyData ? monthlyTrendsRes.data : getMockMonthlyTrends();
        console.log("Final monthly data being used:", monthlyData);
        
        setMonthlyTrends(monthlyData);
        setCategorySpending(categorySpendingRes.data || getMockCategorySpending());
        setBudgetProgress(budgetProgressRes.data || getMockBudgetProgress());
        setDailySpending(dailySpendingRes.data || getMockDailySpending());
        setBiggestTransactions(biggestTransactionsRes.data.formattedTransactions || getMockBiggestTransactions());
        setIncomeHistory(incomeHistoryRes.data || getMockIncomeHistory());
        
      } catch (error) {
        console.error("Error fetching report data:", error);
        setError(error.message === 'No authentication token found' 
          ? "Please log in to view reports" 
          : "Failed to load report data: " + error.message);
          
        // Set mock data even on error
        setMonthlyTrends(getMockMonthlyTrends());
        setCategorySpending(getMockCategorySpending());
        setBudgetProgress(getMockBudgetProgress());
        setDailySpending(getMockDailySpending());
        setBiggestTransactions(getMockBiggestTransactions());
        setIncomeHistory(getMockIncomeHistory());
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, []);
  
  // Mock data generators (will be used if API fails or returns empty data)
  const getMockMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      income: Math.floor(Math.random() * 50000) + 30000,
      expenses: Math.floor(Math.random() * 40000) + 20000
    }));
  };
  
  const getMockCategorySpending = () => {
    return [
      { category: 'Food', amount: 12500 },
      { category: 'Rent', amount: 25000 },
      { category: 'Transport', amount: 5000 },
      { category: 'Entertainment', amount: 7500 },
      { category: 'Shopping', amount: 15000 },
      { category: 'Utilities', amount: 8000 }
    ];
  };
  
  const getMockBudgetProgress = () => {
    return [
      { name: 'Food', current: 12500, limit: 15000 },
      { name: 'Rent', current: 25000, limit: 25000 },
      { name: 'Transport', current: 5000, limit: 7000 },
      { name: 'Entertainment', current: 7500, limit: 5000 },
      { name: 'Shopping', current: 15000, limit: 10000 }
    ];
  };
  
  const getMockDailySpending = () => {
    const result = [];
    const daysInMonth = 30;
    const weeksInMonth = 5;
    
    for (let week = 0; week < weeksInMonth; week++) {
      for (let day = 0; day < 7; day++) {
        const dayOfMonth = week * 7 + day + 1;
        if (dayOfMonth <= daysInMonth) {
          result.push({
            day: dayOfMonth,
            week,
            amount: Math.floor(Math.random() * 2000)
          });
        }
      }
    }
    
    return result;
  };
  
  const getMockBiggestTransactions = () => {
    return [
      { _id: '1', description: 'Monthly Rent', amount: 25000, date: new Date(), type: 'expenditure', tags: ['Rent'] },
      { _id: '2', description: 'Grocery Shopping', amount: 5000, date: new Date(), type: 'expenditure', tags: ['Food'] },
      { _id: '3', description: 'New Laptop', amount: 65000, date: new Date(), type: 'expenditure', tags: ['Shopping'] },
      { _id: '4', description: 'Electricity Bill', amount: 3000, date: new Date(), type: 'expenditure', tags: ['Utilities'] },
      { _id: '5', description: 'Movie Night', amount: 1500, date: new Date(), type: 'expenditure', tags: ['Entertainment'] }
    ];
  };
  
  const getMockIncomeHistory = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      income: Math.floor(Math.random() * 20000) + 40000
    }));
  };
  
  // Helper for budget progress status
  const getBudgetStatusColor = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage > 100) return '#ef4444';
    if (percentage > 85) return '#f59e0b';
    return '#10b981';
  };
  
  // Helper for calculating the maximum value in income vs expense chart
  const getMaxValue = () => {
    if (!monthlyTrends.length) return 50000;
    
    const allValues = monthlyTrends.flatMap(item => [item.income || 0, item.expenses || 0]);
    const maxValue = Math.max(...allValues);
    
    // If all values are 0, return a default value
    if (maxValue <= 0) return 50000;
    
    return maxValue * 1.1; // Add 10% padding
  };
  
  // Daily spending helpers
  const getIntensityColor = (amount, maxAmount) => {
    const ratio = amount / maxAmount;
    const intensity = Math.floor(255 - ratio * 200); // More spending = darker
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  };
  
  const getMaxSpending = () => {
    if (!dailySpending.length) return 2000;
    return Math.max(...dailySpending.map(day => day.amount));
  };
  
  // Helper for rendering money format in tooltips
  const moneyFormatter = (value) => {
    if (value === 0) return "₹0";
    return value.toLocaleString("en-US", { 
      style: "currency", 
      currency: "INR",
      maximumFractionDigits: 0
    });
  }
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="recharts-custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${moneyFormatter(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="reports-page">
        <Navbar />
        <div className="reports-container">
          <div className="loading-state">Loading report data...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="reports-page">
        <Navbar />
        <div className="reports-container">
          <div className="error-state">
            <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const maxSpendingAmount = getMaxSpending();
  
  return (
    <div className="reports-page">
      <Navbar />
      <div className="reports-container">
        <div className="reports-header">
          <h1 className="reports-title">Financial Reports</h1>
        </div>
        
        <div className="reports-grid">

          {/* Monthly Income vs. Expense Trend Chart */}
          <div className="report-card monthly-trends">
            <h2>
              <FontAwesomeIcon icon={faChartLine} className="report-icon" />
              Monthly Income vs. Expenses
            </h2>
            <div className="chart-container">
              {(() => {
                // Check if we have any real data with non-zero values
                const hasData = monthlyTrends.some(item => item.income > 0 || item.expenses > 0);
                
                // If no data, use mock data
                const dataToDisplay = hasData ? monthlyTrends : getMockMonthlyTrends();
                
                if (dataToDisplay.length === 0) {
                  return <div className="no-data-message">No monthly trends data available</div>;
                }
                
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={dataToDisplay}
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
                );
              })()}
            </div>
          </div>
          
          {/* Spending Breakdown by Category */}
          <div className="report-card category-spending">
            <h2>
              <FontAwesomeIcon icon={faChartBar} className="report-icon" />
              Spending by Category
            </h2>
            <div className="chart-container">
              {categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={categorySpending}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 80, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={moneyFormatter}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      width={70}
                    />
                    <Tooltip 
                      formatter={(value) => moneyFormatter(value)}
                      labelFormatter={(value) => `Category: ${value}`}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#8884d8" 
                      radius={[0, 4, 4, 0]}
                      barSize={25}
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 30 + 210}, 70%, 60%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No category spending data available</div>
              )}
            </div>
          </div>
          
          {/* Progress Bars (Budget vs. Actual) */}
          <div className="report-card budget-progress">
            <h2>
              <FontAwesomeIcon icon={faListAlt} className="report-icon" />
              Budget Progress
            </h2>
            <div className="budget-bars">
              {budgetProgress.length > 0 ? (
                budgetProgress.map((budget, index) => {
                  const progress = budget.limit > 0 ? (budget.current / budget.limit) * 100 : 0;
                  const progressWidth = Math.min(progress, 100);
                  const statusColor = getBudgetStatusColor(budget.current, budget.limit);
                  
                  return (
                    <div key={index} className="budget-progress-item">
                      <div className="budget-item-header">
                        <span className="budget-category">{budget.name}</span>
                        <span className="budget-values">
                          {budget.current.toLocaleString("en-US", { style: "currency", currency: "INR" })} of {budget.limit.toLocaleString("en-US", { style: "currency", currency: "INR" })}
                        </span>
                      </div>
                      <div className="budget-progress-bar">
                        <div 
                          className="budget-progress-fill"
                          style={{ 
                            width: `${progressWidth}%`,
                            backgroundColor: statusColor
                          }}
                        ></div>
                      </div>
                      <div className="budget-progress-footer">
                        <span 
                          className="budget-status"
                          style={{ color: statusColor }}
                        >
                          {progress > 100 
                            ? `${Math.floor(progress)}% (Exceeded)` 
                            : `${Math.floor(progress)}%`}
                        </span>
                        <span className="budget-remaining">
                          {budget.limit > budget.current
                            ? `${(budget.limit - budget.current).toLocaleString("en-US", { style: "currency", currency: "INR" })} remaining`
                            : `${(budget.current - budget.limit).toLocaleString("en-US", { style: "currency", currency: "INR" })} over budget`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data-message">No budget data available</div>
              )}
            </div>
          </div>
          
          {/* Daily Spending Heatmap */}
          <div className="report-card daily-spending">
            <h2>
              <FontAwesomeIcon icon={faCalendarAlt} className="report-icon" />
              Daily Spending Heatmap
            </h2>
            <div className="heatmap-container">
              <div className="day-labels">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={index} className="day-label">{day}</div>
                ))}
              </div>
              <div className="heatmap-grid">
                {dailySpending.length > 0 ? (
                  dailySpending.map((day, index) => (
                    <div 
                      key={index}
                      className="heatmap-cell"
                      style={{ 
                        backgroundColor: getIntensityColor(day.amount || 0, maxSpendingAmount || 1),
                        gridColumn: (day.day % 7) || 7, // Convert to 1-7 for days of week
                        gridRow: Math.ceil(day.day / 7)
                      }}
                      title={`Day ${day.day}: ${(day.amount || 0).toLocaleString("en-US", { style: "currency", currency: "INR" })}`}
                    >
                      <span className="day-number">{day.day}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-data-message">No daily spending data available</div>
                )}
              </div>
            </div>
            <div className="heatmap-legend">
              <div className="heatmap-scale">
                <div className="scale-label">Low</div>
                <div className="scale-gradient"></div>
                <div className="scale-label">High</div>
              </div>
              <div className="scale-note">Darker cells indicate higher spending days</div>
            </div>
          </div>
          
          {/* Biggest Transactions */}
          <div className="report-card biggest-transactions">
            <h2>
              <FontAwesomeIcon icon={faListAlt} className="report-icon" />
              Biggest Transactions
            </h2>
            <div className="transactions-list">
              {biggestTransactions.length > 0 ? (
                biggestTransactions.map((transaction, index) => (
                  <div key={index} className="big-transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-description">{transaction.description}</div>
                      <div className={`transaction-amount ${transaction.type === 'revenue' ? 'amount-positive' : 'amount-negative'}`}>
                        {transaction.type === 'revenue' ? '+' : '-'}
                        {Math.abs(transaction.amount || 0).toLocaleString("en-US", { style: "currency", currency: "INR" })}
                      </div>
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-date">
                        <FontAwesomeIcon icon={faCalendar} /> {new Date(transaction.date).toLocaleDateString()}
                      </div>
                      <div className="transaction-tags">
                        {transaction.tags && transaction.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">No transaction data available</div>
              )}
            </div>
          </div>
          
          {/* Income Trend Chart */}
          <div className="report-card income-trend">
            <h2>
              <FontAwesomeIcon icon={faChartLine} className="report-icon" />
              Income Trend (12 Months)
            </h2>
            <div className="chart-container">
              <div className="line-chart income-chart">
                <svg viewBox="0 0 1000 300" className="income-svg">
                  {/* Draw the line */}
                  {(() => {
                    // First check if we have valid data
                    const maxIncome = Math.max(...incomeHistory.map(p => p.income || 0));
                    
                    // Only draw if we have valid income data
                    if (maxIncome <= 0) {
                      return (
                        <text x="500" y="150" textAnchor="middle" className="no-data-message">
                          No income data available for the selected period
                        </text>
                      );
                    }
                    
                    // Generate points for the polyline
                    const points = incomeHistory.map((point, index) => {
                      const x = (index / Math.max(incomeHistory.length - 1, 1)) * 1000;
                      const y = 300 - ((point.income || 0) / maxIncome) * 250;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <polyline
                        className="income-line"
                        points={points}
                      />
                    );
                  })()}
                  
                  {/* Draw the points and labels */}
                  {incomeHistory.map((point, index) => {
                    // Skip rendering if we have invalid data
                    if (!point.income && point.income !== 0) return null;
                    
                    const maxIncome = Math.max(...incomeHistory.map(p => p.income || 0));
                    if (maxIncome <= 0) return null;
                    
                    const x = (index / Math.max(incomeHistory.length - 1, 1)) * 1000;
                    const y = 300 - ((point.income || 0) / maxIncome) * 250;
                    
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          className="income-point"
                        />
                        <text
                          x={x}
                          y={280}
                          textAnchor="middle"
                          className="income-label"
                        >
                          {point.month}
                        </text>
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          className="income-value"
                        >
                          {point.income.toLocaleString("en-US", { 
                            style: "currency", 
                            currency: "INR",
                            maximumFractionDigits: 0
                          })}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
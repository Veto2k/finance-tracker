import Navbar from './Navbar';
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Budgets.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faArrowRight, faExclamationTriangle, faChevronLeft, faChevronRight, faCalendar } from '@fortawesome/free-solid-svg-icons';

const Budgets = () => {
  // State management
  const [budgets, setBudgets] = useState([]);
  const [options, setOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBudgetId, setCurrentBudgetId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    name: "",
    limit: "",
    endDate: "",
    startDate: new Date().toISOString().split('T')[0],
  });

  // Function to get first and last day of a month
  const getMonthDateRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Function to check if a date is within the selected month
  const isDateInSelectedMonth = (dateString) => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const selectedYear = selectedMonth.getFullYear();
    const selectedMonthValue = selectedMonth.getMonth();
    
    return date.getFullYear() === selectedYear && date.getMonth() === selectedMonthValue;
  };

  // Month navigation handlers
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Format month for display
  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Fetch budgets when component mounts or selected month changes
  useEffect(() => {
    const fetchBudgets = async () => {
      setIsLoading(true);
      setError("");

      const dateRange = getMonthDateRange(selectedMonth);
      
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/budgets/get", { 
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: dateRange.startDate
          }
        });
        setBudgets(response.data);
      } catch (error) {
        console.error("Error fetching budgets:", error);
        setError("Failed to fetch budgets. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const getTags = async () => {
      const dateRange = getMonthDateRange(selectedMonth);
      
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/budgets/tags", { 
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        });
        setOptions(response.data);
      } catch (err) {
        console.error("Error fetching tags:", err);
        setError("Failed to fetch budget types. Please try again.");
      }
    };

    getTags();
    fetchBudgets();
  }, [selectedMonth]);

  // Event handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredBudgets = budgets.filter(budget =>
    budget.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (budget = null) => {
    const dateRange = getMonthDateRange(selectedMonth);
    
    if (budget) {
      setIsEditing(true);
      setCurrentBudgetId(budget._id);
      if (!options.includes(budget.name)) {
        setOptions([...options, budget.name]);
      }
      setFormData({
        name: budget.name,
        limit: budget.limit,
        startDate: new Date(budget.startDate).toISOString().split('T')[0],
        endDate: new Date(budget.endDate).toISOString().split('T')[0],
      });
    } else {
      setIsEditing(false);
      setCurrentBudgetId(null);
      setFormData({ 
        name: "", 
        limit: "", 
        endDate: dateRange.endDate,
        startDate: dateRange.startDate
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.limit || !formData.startDate) {
      setError("Please fill all required fields!");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      if (isEditing) {
        const payload = {
          limit: formData.limit,
          startDate: formData.startDate,
          endDate: formData.endDate
        };
        await axios.put(`http://localhost:3000/budgets/edit/${currentBudgetId}`, payload, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
      } else {
        const payload = {
          name: formData.name,
          limit: formData.limit,
          startDate: formData.startDate,
          endDate: formData.endDate
        };
        await axios.post("http://localhost:3000/budgets/add", payload, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
      }
      
      // Refresh budgets
      const dateRange = getMonthDateRange(selectedMonth);
      const response = await axios.get("http://localhost:3000/budgets/get", { 
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setBudgets(response.data);
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving budget:", error);
      setError("Failed to save budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (budget) => {
    setBudgetToDelete(budget);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/budgets/delete/${budgetToDelete._id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // Refresh budgets
      const dateRange = getMonthDateRange(selectedMonth);
      const response = await axios.get("http://localhost:3000/budgets/get", { 
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setBudgets(response.data);
      setDeleteModalOpen(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error("Error deleting budget:", error);
      setError("Failed to delete budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  return (
    <>
      <Navbar />
      <div className="budget-page-container">
        <div className="budget-content-wrapper">

          
          {/* Month Selector */}
          <div className="budget-month-selector">
            <button className="month-nav-button" onClick={goToPreviousMonth}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="month-display">
              <span className="month-text">{formatMonth(selectedMonth)}</span>
              <button className="current-month-button" onClick={goToCurrentMonth} title="Current Month">
                <FontAwesomeIcon icon={faCalendar} />
              </button>
            </div>
            <button className="month-nav-button" onClick={goToNextMonth}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
          
          {error && <div className="budget-error-message">{error}</div>}
          
          <div className="budget-header">
            <div className="budget-search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="budget-search-icon" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="budget-search-input"
              />
            </div>
            <button className="budget-add-button" onClick={() => openModal()}>
              <FontAwesomeIcon icon={faPlus} className="budget-add-icon" />
            </button>
          </div>

          {isLoading ? (
            <div className="budget-loading">Loading budgets...</div>
          ) : (
            <div className="budget-cards-grid">
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map((budget) => {
                  const progress = (budget.current / budget.limit) * 100;
                  const daysRemaining = getDaysRemaining(budget.endDate);
                  const dailyLimit = (budget.limit / 30).toFixed(2);

                  return (
                    <div key={budget._id} className="budget-card">
                      <div className="budget-card-content">
                        <div className="budget-main-row">
                          <div className="budget-top-section">
                            <div className="budget-card-header">
                              <h3 className="budget-card-title">{budget.name}</h3>
                            </div>
                            <div className="budget-actions">
                              <FontAwesomeIcon 
                                icon={faEdit} 
                                className="budget-card-icon budget-card-icon--edit" 
                                onClick={() => openModal(budget)} 
                              />
                              <FontAwesomeIcon 
                                icon={faTrash} 
                                className="budget-card-icon budget-card-icon--delete" 
                                onClick={() => openDeleteModal(budget)} 
                              />
                            </div>
                          </div>

                          <div className="budget-progress-section">
                            <div className="budget-progress-header">
                              <span>
                                {budget.current.toLocaleString("en-US", { style: "currency", currency: "INR" })} of {budget.limit.toLocaleString("en-US", { style: "currency", currency: "INR" })}
                              </span>
                              <span>{progress.toFixed(1)}%</span>
                            </div>
                            <div className="budget-progress-bar">
                              <div 
                                className="budget-progress-fill" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="budget-details">
                          <div className="budget-stat">
                            <span className="stat-value">
                              {Number(dailyLimit).toLocaleString("en-US", { style: "currency", currency: "INR" })}
                            </span>
                            <span className="stat-label">Daily Limit</span>
                          </div>
                          <div className="budget-stat">
                            <span className="stat-value">
                              {(budget.current).toLocaleString("en-US", { style: "currency", currency: "INR" })}
                            </span>
                            <span className="stat-label">Spent</span>
                          </div>
                          <div className="budget-stat">
                            <span className="stat-value">{daysRemaining} days</span>
                            <span className="stat-label">Until {new Date(budget.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="budget-empty-state">
                  <p>No budgets found for {formatMonth(selectedMonth)}. Create a new budget to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className={`budget-modal-overlay ${modalOpen ? "budget-modal-overlay--open" : ""}`}>
          <div className="budget-modal">
            <button className="budget-modal-close" onClick={() => setModalOpen(false)}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <h3 className="budget-modal-title">{isEditing ? "Edit Budget" : "Add Budget"}</h3>
            <form className="budget-modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">
                  Budget Name
                  <span className="required-asterisk">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    className="budget-modal-input"
                    readOnly
                    disabled
                  />
                ) : (
                  <select
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="budget-modal-input"
                    required
                  >
                    <option value="" disabled hidden>Select Budget Type</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="limit">
                  Budget Limit
                  <span className="required-asterisk">*</span>
                </label>
                <input 
                  id="limit"
                  type="number" 
                  name="limit" 
                  placeholder="Budget Limit" 
                  value={formData.limit} 
                  onChange={handleChange}
                  className="budget-modal-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date
                  <span className="required-asterisk">*</span>
                </label>
                <input 
                  id="startDate"
                  type="date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleChange}
                  className="budget-modal-input"
                  required
                  // min={getMonthDateRange(selectedMonth).startDate}
                  // max={getMonthDateRange(selectedMonth).endDate}
                />
                {!isDateInSelectedMonth(formData.startDate) && formData.startDate && (
                  <div className="date-warning">Date should be within the selected month</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input 
                  id="endDate"
                  type="date" 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleChange}
                  className="budget-modal-input"
                  // min={formData.startDate || getMonthDateRange(selectedMonth).startDate}
                  // max={getMonthDateRange(selectedMonth).endDate}
                />
                {!isDateInSelectedMonth(formData.endDate) && formData.endDate && (
                  <div className="date-warning">Date should be within the selected month</div>
                )}
              </div>

              <div className="budget-modal-actions">
                <button 
                  type="button" 
                  className="budget-modal-button budget-modal-button--cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="budget-modal-button budget-modal-button--submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : (isEditing ? "Update" : "Add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="budget-modal-overlay budget-modal-overlay--open">
          <div className="budget-modal budget-delete-modal">
            <div className="budget-delete-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3 className="budget-delete-title">Delete Budget</h3>
            <p className="budget-delete-message">
              Are you sure you want to delete "{budgetToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="budget-delete-actions">
              <button 
                className="budget-delete-button budget-delete-button--cancel"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setBudgetToDelete(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="budget-delete-button budget-delete-button--confirm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Budgets;

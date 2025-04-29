import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faAsterisk } from '@fortawesome/free-solid-svg-icons';

import "react-datepicker/dist/react-datepicker.css";
import "./Transactions.css";

/**
 * Transactions Component
 * Manages the display and manipulation of financial transactions
 * Includes features for adding, editing, deleting, and filtering transactions
 */
const Transactions = () => {
  // State Management
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [editTransaction, setEditTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination and Sorting State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(1);
  const limit = 10;
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTag, setSearchTag] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [type, setType] = useState("");
  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "revenue", label: "Revenue" },
    { value: "expenditure", label: "Expenditure" }
  ];
  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: today,
    type: "expenditure",
    tags: [],
    tagsBackend: []
  });

  const animatedComponents = makeAnimated();

  /**
   * Closes the modal and resets the form data
   */
  const closeModal = () => {
    setShowModal(false);
    setEditTransaction(null);
    setFormData({
      description: "",
      amount: "",
      type: "expenditure",
      date: today,
      tags: [],
      tagsBackend: []
    });
  };

  /**
   * Fetches transactions and tags from the backend
   */
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError("");
      
      // Set a timeout to show error if fetch takes too long
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setError("Error fetching transactions. Please try again.");
          setIsLoading(false);
        }
      }, 5000); // 5 seconds timeout

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await axios.get("http://localhost:3000/transactions/get", {
          params: {
            page,
            limit,
            type,
            sortField: sortConfig.key,
            sortOrder: sortConfig.direction,
            startDate,
            endDate,
            search: searchQuery,
            searchTag
          },
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });

        setError("");
        clearTimeout(timeoutId);
        setTransactions(res.data.formattedTransactions);
        setTotalPages(res.data.totalPages);
        setTotalTransactions(res.data.totalCount);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Error fetching transactions:", err);
        setError("Failed to fetch transactions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3000/tags/get" , { headers: { Authorization: `Bearer ${token}` } });
        const tags = res.data.map(tag => ({
          value: tag,
          label: tag
        }));
        setTagOptions(tags);
      } catch (err) {
        console.error("Error fetching tags", err);
        setError("Failed to fetch tags");
      }
    };

    fetchTags();
    fetchTransactions();
  }, [page, searchQuery, searchTag, dateRange, sortConfig, type]);

  /**
   * Handles form input changes
   */
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Handles tag selection in the form
   */
  const handleTagChangeForm = async (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({
      ...prev,
      tags: selectedOptions,
      tagsBackend: selectedValues
    }));

    const newOptions = selectedOptions?.filter(opt => !tagOptions.some(tag => tag.value === opt.value));

    if (newOptions?.length) {
      setTagOptions(prev => [...prev, ...newOptions]);
      try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:3000/tags/new", { name: newOptions[0].value } , { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.log("Error creating tag:", err);
      }
    }
  };

  /**
   * Handles tag selection in the search filter
   */
  const handleSearchTag = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setSearchTag(selectedValues);
    setPage(1);
  };

  /**
   * Handles tag changes in the transaction table rows
   */
  const handleTagChangeRow = async (selectedOptions, txnIndex) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    const updatedTransactions = [...transactions];
    updatedTransactions[txnIndex].tags = selectedValues;
    setTransactions(updatedTransactions);

    const newOptions = selectedOptions?.filter(opt => !tagOptions.some(tag => tag.value === opt.value));

    if (newOptions?.length) {
      setTagOptions(prev => [...prev, ...newOptions]);
      try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:3000/tags/new", { name: newOptions[0].value }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.log("Error creating tag:", err);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const txnId = updatedTransactions[txnIndex]._id;
      await axios.put(`http://localhost:3000/transactions/updateTags/${txnId}`, {
        tags: selectedValues,
      } , { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Error updating tags:", err);
      setError("Failed to update tags");
    }
  };

  /**
   * Opens the edit modal with transaction data
   */
  const openEditModal = (txn) => {
    const formattedDate = txn.date ? new Date(txn.date).toISOString().split('T')[0] : today;
    const selectedTags = tagOptions.filter(option => txn.tags.includes(option.value));

    setEditTransaction(txn._id);
    setFormData({
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
      date: formattedDate,
      tags: selectedTags,
      tagsBackend: txn.tags
    });
    setShowModal(true);
  };

  /**
   * Handles sorting of transactions
   */
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /**
   * Handles form submission for adding/editing transactions
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        date: formData.date,
        tags: formData.tagsBackend
      };

      if (editTransaction) {
        await axios.put(`http://localhost:3000/transactions/update/${editTransaction}`, payload , { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("http://localhost:3000/transactions/add", payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      window.location.reload();
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError("Failed to save transaction");
    }
  };

  /**
   * Handles transaction deletion
   */
  const confirmDeleteTransaction = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/transactions/delete/${editTransaction}` , { headers: { Authorization: `Bearer ${token}` } });
      window.location.reload();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction");
    }
  };

  /**
   * Handles search input changes
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  /**
   * Handles type filter change
   */
  const handleTypeChange = (selectedOption) => {
    setType(selectedOption.value);
    setPage(1);
  };

  /**
   * Toggles between revenue and expenditure types
   */
  const toggleType = () => {
    setFormData(prev => ({
      ...prev,
      type: prev.type === "revenue" ? "expenditure" : "revenue"
    }));
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div>
      <Navbar />
      <div className="transactions-container">
        
        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="form-group">
            <label htmlFor="description">Search By:</label>
            <input
              id="description"
              type="text"
              placeholder="Description"
              value={searchQuery}
              onChange={handleSearchChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type:</label>
            <Select
              id="type"
              value={typeOptions.find(option => option.value === type)}
              onChange={handleTypeChange}
              options={typeOptions}
              className="select-single"
              placeholder="Select Type"
              isClearable
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags: </label>
            <Select
              id="tags"
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={tagOptions}
              onChange={handleSearchTag}
              placeholder="Select Tags for filter"
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              menuPosition="fixed"
              className="select-single"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date: </label>
            <DatePicker
              id="date"
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              isClearable
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date range"
              className="form-input"
            />
          </div>

          <button className="btn btn-add" onClick={() => setShowModal(true)}>
            + Add
          </button>
          <button className="btn btn-reset" onClick={() => setSortConfig({ key: null, direction: 'asc' })}>
            Reset
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : (
          <>
            {/* Transactions Table */}
            <table className="transaction-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                    Description {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                    Amount {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="date-cell" onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                    Date {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, index) => (
                  <tr key={txn._id}>
                    <td>{txn.description}</td>
                    <td style={{
                      color: txn.type === "revenue" ? "#2ecc71" : txn.type === "expenditure" ? "#e74c3c" : "",
                      fontWeight: txn.type ? 600 : "normal"
                    }}>
                      {txn.amount.toLocaleString("en-US", { style: "currency", currency: "INR" })}
                    </td>
                    <td className="date-cell">{txn.date ? formatDate(txn.date) : ''}</td>
                    <td>
                      <CreatableSelect
                        closeMenuOnSelect={false}
                        components={animatedComponents}
                        isMulti
                        options={tagOptions}
                        value={txn.tags.map(tag => ({ value: tag, label: tag }))}
                        onChange={(selectedOptions) => handleTagChangeRow(selectedOptions, index)}
                        placeholder="Select Tags"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPosition="fixed"
                      />
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => openEditModal(txn)} title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="action-btn action-btn-delete" onClick={() => { setShowDeleteModal(true); setEditTransaction(txn._id); }} title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{margin:'0px'}}>{page*10 < totalTransactions ? page * 10 : totalTransactions} of {totalTransactions}</p>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>Next</button>
            </div>
          </>
        )}

        {/* Add/Edit Transaction Modal */}
        {showModal && (
          <div className="transaction-modal">
            <div className="transaction-modal-content">
              <form onSubmit={handleSubmit}>
                <h3>{editTransaction ? "Edit Transaction" : "Add Transaction"}</h3>
                
                <div className="form-group">
                  <label>
                    Description
                    {!editTransaction && <FontAwesomeIcon icon={faAsterisk} style={{ color: '#e74c3c', fontSize: '0.5em', verticalAlign: 'super', marginLeft: '2px' }}/>}
                  </label>
                  <input 
                    type="text" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                    placeholder="Enter description"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Amount
                    {!editTransaction && <FontAwesomeIcon icon={faAsterisk} style={{ color: '#e74c3c', fontSize: '0.5em', verticalAlign: 'super', marginLeft: '2px' }}/>}
                  </label>
                  <input 
                    type="number" 
                    name="amount" 
                    min={1} 
                    max={99999999} 
                    value={formData.amount} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange} 
                    required 
                    className="form-input" 
                  />
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <CreatableSelect
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    isMulti
                    options={tagOptions}
                    value={formData.tags}
                    onChange={handleTagChangeForm}
                    placeholder="Select or create tags"
                    menuPortalTarget={document.body}
                    styles={{ 
                      menuPortal: base => ({ ...base, zIndex: 9999 }),
                      control: base => ({ ...base, marginTop: '4px' })
                    }}
                    menuPosition="fixed"
                    className="select-multi"
                  />
                </div>

                <button
                  type="button"
                  className={`transaction-type-toggle ${formData.type}`}
                  onClick={toggleType}
                >
                  {formData.type === "revenue" ? "💰 Revenue" : "💸 Expenditure"}
                </button>

                <div className="button-group">
                  <button type="button" onClick={closeModal}>Cancel</button>
                  <button type="submit">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="transaction-delete-modal">
            <div className="transaction-modal-content delete-modal">
              <h3>Delete Transaction</h3>
              <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
              <div className="button-group">
                <button type="button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="submit" onClick={confirmDeleteTransaction} style={{ backgroundColor: '#e74c3c' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faMapMarkerAlt, 
  faCalendarAlt, 
  faEdit, 
  faLock, 
  faShieldAlt, 
  faSignOutAlt,
  faCamera,
  faEye,
  faEyeSlash,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    createdAt: '',
    type: '',
    profileImage: null
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get('http://localhost:3000/profile/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load profile data. Please try again later.');
      setIsLoading(false);
      console.error('Error fetching profile:', err);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setImageUploading(true);
      const token = localStorage.getItem('token');
      
      // Create form data
      const formData = new FormData();
      formData.append('profileImage', file);
      
      // Upload the image to the backend
      const response = await axios.post('http://localhost:3000/profile/upload-image', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh user data after successful upload
      fetchUserProfile();
      
    } catch (err) {
      setError('Failed to upload profile image. Please try again.');
      console.error('Error uploading profile image:', err);
    } finally {
      setImageUploading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Only send name in the update
      const updateData = {
        name: user.name
      };
      
      await axios.put('http://localhost:3000/profile/user', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const requestData = user.type === 'google' 
        ? { newPassword: passwordData.newPassword }
        : { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword };
      
      await axios.put('http://localhost:3000/profile/change-password', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please try again.');
      console.error('Error changing password:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete('http://localhost:3000/profile/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      console.error('Error deleting account:', err);
      setShowDeleteModal(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              <FontAwesomeIcon icon={faEdit} /> {isEditing ? 'Cancel Editing' : 'Edit Name/Photo'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {isLoading ? (
            <div className="loading">Loading profile data...</div>
          ) : (
            <div className="profile-content">
              <div className="profile-sidebar">
                <div className="profile-picture-container">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt="Profile" 
                      className="profile-picture"
                    />
                  ) : (
                    <div className="profile-picture-placeholder">
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="profile-picture-upload">
                      {imageUploading ? (
                        <div className="uploading-spinner">...</div>
                      ) : (
                        <>
                          <label htmlFor="profile-picture-input">
                            <FontAwesomeIcon icon={faCamera} />
                          </label>
                          <input 
                            id="profile-picture-input"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            style={{ display: 'none' }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="profile-actions">
                  <button 
                    className="profile-action-btn"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <FontAwesomeIcon icon={faLock} /> {user.type === 'google' ? 'Create Password' : 'Change Password'}
                  </button>
                  
                  <button 
                    className="profile-action-btn"
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                  </button>
                  
                  <button 
                    className="profile-action-btn logout-btn"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Account
                  </button>
                </div>
              </div>
              
              <div className="profile-details">
                <div className="profile-section">
                  <h2>Personal Information</h2>
                  
                  <div className="profile-field">
                    <label>Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleInputChange}
                        className="profile-input"
                      />
                    ) : (
                      <p>{user.name || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div className="profile-field">
                    <label>Email</label>
                    <p>{user.email || 'Not provided'}</p>
                  </div>
                  
                  <div className="profile-field">
                    <label>Login type</label>
                    <p>
                      {user.type ? (
                        <>
                          <FontAwesomeIcon icon={faUser} className="field-icon" />
                          {user.type}
                        </>
                      ) : 'Not provided'}
                    </p>
                  </div>
                  
                  <div className="profile-field">
                    <label>Join Date</label>
                    <p>
                      <FontAwesomeIcon icon={faCalendarAlt} className="field-icon" />
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="profile-actions-bottom">
                    <button 
                      className="save-btn"
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{user.type === 'google' ? 'Create Password' : 'Change Password'}</h2>
            {passwordError && <div className="error-message">{passwordError}</div>}
            <form onSubmit={handleChangePassword}>
              {user.type !== 'google' && (
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="password-input"
                      required
                    />
                    <button 
                      type="button" 
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="password-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="password-input"
                    required
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                >
                  {user.type === 'google' ? 'Create Password' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-account-modal">
            <h2>Delete Account</h2>
            <div className="delete-modal-content">
              <p className="delete-warning">
                <FontAwesomeIcon icon={faTrash} className="delete-icon" />
                Are you sure you want to delete your account?
              </p>
              <p className="delete-description">
                This action cannot be undone. All your data will be permanently removed.
              </p>
              
              <div className="delete-modal-actions">
                <button 
                  type="button" 
                  className="delete-cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="delete-confirm-btn"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
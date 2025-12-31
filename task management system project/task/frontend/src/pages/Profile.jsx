import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../library/api.js';
import { Camera, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [publicId, setPublicId] = useState(null);
  const [message, setMessage] = useState('');
  const [avatar, setAvatar] = useState(null)

  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get('/getuser');
        console.log(res.data);
        
        setImageUrl(res.data.profilePic || null);
        setAvatar(res.data.avatar || null);
        setPublicId(res.data.profilePicPublicId || null);
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) {
      setMessage('Pehle file select karo!');
      return;
    }

    const formData = new FormData();
    formData.append('profilePic', selectedFile);

    try {
      const { data } = await API.post('/profilepic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setMessage(data.message);
      toast.success(`Profile picture uploaded successfully!`)
      setImageUrl(data.url);
      setPublicId(data.publicId);
      setFile(null);
    } catch (error) {
      setMessage(`Upload fail: ${error.response?.data.message || error.message}`);
      toast.error(`Upload fail: ${error.response?.data.message || error.message}`)
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account?')) return;

    try {
      const { data } = await API.delete('/delete-account', {
        withCredentials: true,
      });
      setMessage(data.message);
      setImageUrl(null);
      setPublicId(null);
      navigate('/login');
    } catch (error) {
      setMessage(`Delete fail: ${error.response?.data.message || error.message}`);
      toast.error(`Delete fail: ${error.response?.data.message || error.message}`)
    }
  };

  const handleDeleteProfilePic = async () => {
    if (!publicId) {
      setMessage('No profile picture to delete!');
      return;
    }

    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      const { data } = await API.delete('/profilepic', {
        withCredentials: true,
      });
      toast.success(`Profile picture deleted successfully!`)
      setMessage(data.message || 'Profile picture deleted successfully!');
      setImageUrl(null);
      setPublicId(null);
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      setMessage(`Delete fail: ${error.response?.data.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <div className="p-6 bg-base-200 shadow-lg rounded-lg">
          <span className="loading loading-infinity loading-xl text-5xl"></span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={avatar || imageUrl || '/image/user.png'}
              alt="Profile"
              className="size-32 rounded-full object-cover border-4"
            />
            <label
              htmlFor="avatar-upload"
              className={`
                absolute bottom-0 right-0 
                bg-base-content hover:scale-105
                p-2 rounded-full cursor-pointer 
                transition-all duration-200
                ${file ? 'animate-pulse pointer-events-none' : ''}
              `}
            >
              <Camera className="w-5 h-5 text-base-200" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
            {imageUrl && (
              <button
                onClick={handleDeleteProfilePic}
                className="btn btn-soft btn-error cursor-pointer text-2xl rounded-2xl p-2 absolute top-0 right-0"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
          <p className="text-sm text-zinc-400">
            {message || 'Click the camera icon to update your photo'}
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>

        <div className="border p-4 rounded-lg bg-base-100">
          <h3 className="text-xl text-black font-semibold">User Details:</h3>
          <pre className="bg-base-200 text-black p-2 rounded">
            <h3>Name: {user?.name}</h3>
            <h3>Email: {user?.email}</h3>
          </pre>
        </div>

        <button
          className="btn btn-soft btn-primary cursor-pointer text-white text-2xl rounded-2xl p-2"
          onClick={logout}
        >
          Logout
        </button>

        <Link
          to="/dashboard"
          className="btn btn-soft btn-primary cursor-pointer text-white text-2xl rounded-2xl p-2"
        >
          Dashboard
        </Link>

        <button
          className="btn btn-soft btn-primary cursor-pointer text-white text-2xl rounded-2xl p-2"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </button>
      </div>
    </>
  );
};

export default Profile;
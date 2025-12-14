'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    profession: '',
    budget: '',
    habits: '',
    preferredLocation: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Parse budget range
      const budgetRange = formData.budget.split('-');
      const budgetMin = parseInt(budgetRange[0]);
      const budgetMax = budgetRange[1] === '+' ? parseInt(budgetRange[0]) + 10000 : parseInt(budgetRange[1]);

      // Step 1: Register user (create account)
      const registerResponse = await fetch('http://localhost:1010/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: `${formData.name.toLowerCase().replace(/\s+/g, '')}@roomease.com`, // Auto-generate email
          password: 'password123' // Default password
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerData.success) {
        alert('Registration failed: ' + registerData.message);
        setLoading(false);
        return;
      }

      const userId = registerData.data.user.id;

      // Step 2: Complete profile with all details
      const profileResponse = await fetch(`http://localhost:1010/api/profiles/${userId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender: formData.gender,
          age: 25, // Default age
          profession: formData.profession,
          occupation: 'Working Professional', // Default
          budgetMin: budgetMin,
          budgetMax: budgetMax,
          bio: `Looking for accommodation. Habits: ${formData.habits}`,
          lookingFor: 'Both',
          habits: {
            smoking: 'No',
            drinking: 'No',
            pets: 'No pets',
            cleanliness: 'Moderate'
          },
          preferredLocations: [
            {
              area: formData.preferredLocation,
              city: 'Dhaka'
            }
          ],
          languages: ['Bengali', 'English'],
          interests: formData.habits.split(',').map(h => h.trim())
        }),
      });

      const profileData = await profileResponse.json();

      if (profileData.success) {
        alert('✅ Registration successful! Welcome to RoomEase!');
        console.log('User Data:', profileData.data);
        
        // Reset form
        setFormData({
          name: '',
          gender: '',
          profession: '',
          budget: '',
          habits: '',
          preferredLocation: ''
        });
      } else {
        alert('Profile completion failed: ' + profileData.message);
      }

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error connecting to server. Make sure backend is running on port 1010.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#7FFFD4] py-4 border-b-4 border-blue-600">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="12" cy="15" r="3.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2"/>
            </svg>
            <h1 className="text-3xl font-bold text-black">RoomEase</h1>
          </div>
          <p className="text-red-600 font-semibold text-sm">Online Rental & Roommate Finder</p>
        </div>
      </header>

      {/* Registration Form */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-8 uppercase text-black">USER REGISTRATION</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="NAME"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-200 border-none rounded text-sm placeholder-gray-500 text-black focus:bg-gray-200 focus:outline-none uppercase disabled:opacity-50"
          />
          
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-200 border-none rounded text-sm text-gray-600 focus:bg-gray-200 focus:outline-none appearance-none uppercase disabled:opacity-50"
          >
            <option value="">GENDER</option>
            <option value="Male">MALE</option>
            <option value="Female">FEMALE</option>
            <option value="Other">OTHER</option>
          </select>
          
          <input
            type="text"
            name="profession"
            placeholder="PROFESSION"
            value={formData.profession}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-200 border-none rounded text-sm placeholder-gray-500 text-black focus:bg-gray-200 focus:outline-none uppercase disabled:opacity-50"
          />
          
          <select
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-200 border-none rounded text-sm text-gray-600 focus:bg-gray-200 focus:outline-none appearance-none uppercase disabled:opacity-50"
          >
            <option value="">BUDGET</option>
            <option value="5000-10000">5,000 - 10,000 BDT</option>
            <option value="10000-15000">10,000 - 15,000 BDT</option>
            <option value="15000-20000">15,000 - 20,000 BDT</option>
            <option value="20000-25000">20,000 - 25,000 BDT</option>
            <option value="25000-30000">25,000 - 30,000 BDT</option>
            <option value="30000+">30,000+ BDT</option>
          </select>

          <input
            type="text"
            name="habits"
            placeholder="HABITS"
            value={formData.habits}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-200 border-none rounded text-sm placeholder-gray-500 text-black focus:bg-gray-200 focus:outline-none uppercase disabled:opacity-50"
          />

          <input
            type="text"
            name="preferredLocation"
            placeholder="PREFERRED LOCATION"
            value={formData.preferredLocation}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-200 border-none rounded text-sm placeholder-gray-500 text-black focus:bg-gray-200 focus:outline-none uppercase disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded uppercase transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>
      </main>
    </div>
  );
}


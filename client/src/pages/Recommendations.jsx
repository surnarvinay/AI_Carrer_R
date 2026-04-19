import React, { useState } from 'react';
import CareerForm from '../components/CareerForm';
import Results from '../components/Results';

export default function Recommendations() {
  const [careers, setCareers] = useState([]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Recommendations</h1>
        <p className="page-subtitle">Fill in your details and get personalized career suggestions.</p>
      </div>
      <CareerForm onResults={setCareers} />
      <Results careers={careers} />
    </div>
  );
}

import React, { useState } from 'react';
import CareerForm from '../components/CareerForm';
import Results    from '../components/Results';

export default function Recommendations() {
  const [careers,  setCareers]  = useState([]);
  const [enriched, setEnriched] = useState(null);

  const handleResults = (careers, enriched) => {
    setCareers(careers);
    setEnriched(enriched || null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Recommendations</h1>
        <p className="page-subtitle">Fill in your details and get personalized career suggestions across all domains.</p>
      </div>
      <CareerForm onResults={handleResults} />
      <Results careers={careers} enriched={enriched} />
    </div>
  );
}

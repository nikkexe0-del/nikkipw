import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentApiUrl, getBatches } from '../services/apiService';
import CourseCard from './CourseCard';

const ScienceAndFun = () => {
  const router = useRouter();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    setError('');
    try {
      await getCurrentApiUrl();
      const response = await getBatches();
      const data = response.data || response || [];
      setBatches(data);
      if (data.length === 0) setError('No courses available at the moment.');
    } catch (e) {
      console.error(e);
      setError('Server temporarily down. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (batchId) => {
    router.push(`/batch/${batchId}`);
  };

  return (
    <div className="mesh-bg" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Hero header */}
        <div className="fade-in-up" style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '100px',
            padding: '6px 16px',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ⚡ Premium Free Education
            </span>
          </div>
          
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 52px)',
            color: '#f1f5f9',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            All Courses &{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Batches</span>
          </h1>
          
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
            Top quality education, completely free. No login required. Just learn.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: '280px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && batches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>😔</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>
              Oops!
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
            <button
              onClick={loadBatches}
              className="btn-gold"
              style={{ padding: '12px 28px', fontSize: '14px' }}
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Courses grid */}
        {!loading && batches.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{batches.length}</span> courses available
                </span>
              </div>
            </div>

            <div
              className="stagger"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
              {batches.map((batch) => (
                <CourseCard
                  key={batch.id}
                  course={batch}
                  onClick={() => handleCourseClick(batch.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScienceAndFun;

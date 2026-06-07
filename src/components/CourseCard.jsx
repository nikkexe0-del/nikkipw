import React from 'react';

const CourseCard = ({ course, onClick }) => {
  const name = course.course_name || course.name || 'Course';
  const thumb = course.course_thumbnail || course.thumbnail;

  return (
    <div
      className="premium-card"
      onClick={onClick}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%',
        height: '160px',
        background: 'linear-gradient(135deg, #1a2332, #0d1421)',
        overflow: 'hidden',
        borderRadius: '14px 14px 0 0',
        flexShrink: 0,
        position: 'relative',
      }}>
        {thumb ? (
          <img
            src={thumb}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Course
              </div>
            </div>
          </div>
        )}
        
        {/* Free badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#000',
          fontSize: '10px',
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: '6px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          FREE
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#f1f5f9',
          marginBottom: '12px',
          lineHeight: 1.4,
          flex: 1,
        }} className="line-clamp-2">
          {name}
        </h3>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>₹0</span>
            <span style={{ fontSize: '11px', color: '#475569', textDecoration: 'line-through' }}>₹999</span>
          </div>
          <button
            className="btn-gold"
            style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
